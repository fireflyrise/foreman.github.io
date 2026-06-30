import path from "node:path";
import fs from "node:fs";
import { query, type Query, type SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import type { AgentEvent, AuthMode, SessionStatus } from "@foreman/shared";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { RepoManager } from "../git/RepoManager.js";
import { openPullRequest, mergePullRequest } from "../integrations/github.js";
import { fetchLatestLogs } from "../integrations/railway.js";
import { createRailwayMcpServer } from "./mcp/railwayLogsTool.js";
import { createLogoMcpServer } from "./mcp/logoTool.js";
import { recordError } from "../errors/store.js";
import { ErrorType } from "../errors/types.js";
import {
  buildAutonomyAppend,
  buildInstructionMessage,
  buildRailwayFixMessage,
  type GoalContext,
} from "./prompts.js";
import { AsyncInbox } from "./AsyncInbox.js";

interface QueuedInstruction {
  id: string | null; // null = synthetic (e.g. Railway fix)
  text: string;
}

interface StartArgs {
  projectId: string;
  userId: string;
  repoOwner: string;
  repoName: string;
  defaultBranch: string;
  mergePolicy: string;
  goal: GoalContext;
  instructions: Array<{ id: string; text: string }>;
  /** "subscription" → Max plan (CLAUDE_CODE_OAUTH_TOKEN); "api" → ANTHROPIC_API_KEY. */
  authMode: AuthMode;
}

type Subscriber = (e: AgentEvent) => void;

/** Heuristic: does this error result look like a subscription usage/rate limit? */
function isUsageLimit(msg: Record<string, unknown>): boolean {
  if (Number(msg.api_error_status) === 429) return true;
  const text = `${msg.result ?? ""} ${msg.stop_reason ?? ""}`.toLowerCase();
  return /usage limit|rate limit|limit reached|quota|too many requests|429/.test(text);
}

/**
 * Owns one long-lived Claude Agent SDK session for a single project. Feeds the
 * project's instructions one at a time (next sent only after the prior turn's
 * `result` message), streams mapped events to SSE subscribers, persists a
 * transcript, and drives the git/PR flow.
 */
export class AgentSession {
  readonly projectId: string;
  private readonly userId: string;
  private readonly repo: RepoManager;
  private readonly mergePolicy: string;
  private readonly goal: GoalContext;
  private readonly authMode: AuthMode;
  /** Set when a subscription session has been told to fall back to the API key. */
  private apiKeyOverride = false;
  /** Holds the instruction that hit the limit, so we can retry it on resume. */
  private limitedInstruction: QueuedInstruction | null = null;

  private inbox = new AsyncInbox<SDKUserMessage>();
  private q: Query | null = null;
  private subscribers = new Set<Subscriber>();

  private queue: QueuedInstruction[] = [];
  private currentInstruction: QueuedInstruction | null = null;
  private total = 0;
  private sentCount = 0;

  private sessionDbId: string | null = null;
  private branchName = "";
  private prNumber: number | null = null;
  private totalCostUsd = 0;
  private sdkSessionId: string | null = null;

  status: SessionStatus = "idle";
  private stopped = false;

  /** How many times we've auto-injected a Railway deploy fix this session. */
  private railwayAutoFixAttempts = 0;
  /** Cap on automatic deploy self-heal rounds before we give up and finalize. */
  private static readonly MAX_RAILWAY_AUTOFIX = 2;
  /** Fixed wait after the final merge for Railway to build + deploy (ms). */
  private static readonly DEPLOY_WAIT_MS = 5 * 60 * 1000;

  constructor(args: StartArgs) {
    this.projectId = args.projectId;
    this.userId = args.userId;
    this.mergePolicy = args.mergePolicy;
    this.goal = args.goal;
    this.authMode = args.authMode;
    this.queue = args.instructions.map((i) => ({ id: i.id, text: i.text }));
    this.total = this.queue.length;
    this.repo = new RepoManager(
      args.userId,
      args.projectId,
      args.repoOwner,
      args.repoName,
      args.defaultBranch,
    );
  }

  // ─── Subscriptions (SSE) ──────────────────────────────────────────────────

  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  private emit(event: AgentEvent): void {
    for (const fn of this.subscribers) {
      try {
        fn(event);
      } catch {
        /* ignore subscriber errors */
      }
    }
    // Persist (fire-and-forget) for replay.
    if (this.sessionDbId && event.type !== "heartbeat") {
      void prisma.sessionEvent
        .create({
          data: {
            sessionId: this.sessionDbId,
            type: event.type,
            payload: event as object,
          },
        })
        .catch(() => undefined);
    }
  }

  private setStatus(status: SessionStatus): void {
    this.status = status;
    this.emit({ type: "session_status", status, sessionId: this.sessionDbId ?? "" });
    if (this.sessionDbId) {
      void prisma.session
        .update({ where: { id: this.sessionDbId }, data: { status } })
        .catch(() => undefined);
    }
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  async start(): Promise<void> {
    this.emit({ type: "log", level: "info", text: "Preparing repository…" });
    await this.repo.prepare();
    const slug = `${this.projectId}`.slice(0, 8);
    this.branchName = await this.repo.createSessionBranch(slug);
    this.emit({ type: "git", action: "branch", detail: `Created branch ${this.branchName}` });

    const session = await prisma.session.create({
      data: { projectId: this.projectId, branchName: this.branchName, status: "running" },
    });
    this.sessionDbId = session.id;

    // Reset instruction statuses to pending for those we will run.
    await prisma.instruction.updateMany({
      where: { projectId: this.projectId, id: { in: this.queue.map((q) => q.id).filter((x): x is string => !!x) } },
      data: { status: "pending" },
    });

    this.startConsumeLoop();
    this.sendNext();
  }

  private buildOptions() {
    return {
      cwd: this.repo.workdir,
      // Only force a model when explicitly configured — an unknown model id
      // makes the Claude Code process exit immediately.
      ...(env.agentModel ? { model: env.agentModel } : {}),
      permissionMode: "bypassPermissions" as const,
      systemPrompt: {
        type: "preset" as const,
        preset: "claude_code" as const,
        append: buildAutonomyAppend(this.goal),
      },
      mcpServers: {
        railway: createRailwayMcpServer(this.userId, this.projectId),
        logo: createLogoMcpServer(this.userId),
      },
      canUseTool: async () => ({ behavior: "allow" as const, updatedInput: {} }),
      // Surface subprocess stderr to the console so failures are diagnosable.
      stderr: (d: string) => {
        const t = d.trim();
        if (t) this.emit({ type: "log", level: "error", text: t.slice(0, 1000) });
      },
      env: this.buildAuthEnv(),
    };
  }

  /**
   * Build the subprocess env with exactly one credential set. The two are
   * mutually exclusive — if ANTHROPIC_API_KEY is present it overrides the
   * subscription token — so we null out the one we are not using.
   */
  private buildAuthEnv(): Record<string, string | undefined> {
    const useApi = this.authMode === "api" || this.apiKeyOverride;
    return {
      ...process.env,
      // Claude Code refuses --dangerously-skip-permissions (bypassPermissions)
      // as root unless it's told it's in a sandbox. Foreman runs in an isolated
      // container, so allow it.
      IS_SANDBOX: "1",
      ANTHROPIC_API_KEY: useApi ? env.anthropicApiKey : undefined,
      CLAUDE_CODE_OAUTH_TOKEN: useApi ? undefined : env.claudeCodeOauthToken,
    };
  }

  /** The credential mode actually in effect right now. */
  private effectiveMode(): AuthMode {
    return this.authMode === "api" || this.apiKeyOverride ? "api" : "subscription";
  }

  private startConsumeLoop(): void {
    const options = this.buildOptions();
    this.q = query({ prompt: this.inbox, options });
    this.emit({ type: "auth_mode", mode: this.effectiveMode() });
    void this.consume();
  }

  private async consume(): Promise<void> {
    if (!this.q) return;
    try {
      for await (const msg of this.q) {
        if (this.stopped) break;
        await this.handleMessage(msg);
      }
    } catch (err) {
      this.emit({ type: "log", level: "error", text: `Session error: ${(err as Error).message}` });
      await recordError({
        errorType: ErrorType.AGENT_SESSION_ERROR,
        error: err,
        project: this.projectId,
        context: {
          sessionDbId: this.sessionDbId,
          branchName: this.branchName,
          authMode: this.effectiveMode(),
          instructionId: this.currentInstruction?.id ?? null,
        },
      });
      this.setStatus("error");
      await this.finalize();
    }
  }

  private async handleMessage(msg: { type: string; [k: string]: unknown }): Promise<void> {
    switch (msg.type) {
      case "system": {
        const sid = (msg as { session_id?: string }).session_id;
        if (sid) {
          this.sdkSessionId = sid;
          if (this.sessionDbId) {
            void prisma.session
              .update({ where: { id: this.sessionDbId }, data: { sdkSessionId: sid } })
              .catch(() => undefined);
          }
        }
        this.emit({ type: "system", text: "Session initialized." });
        break;
      }
      case "assistant": {
        const content = (msg as { message?: { content?: unknown[] } }).message?.content ?? [];
        for (const block of content as Array<Record<string, unknown>>) {
          if (block.type === "text") {
            this.emit({ type: "assistant_text", text: String(block.text ?? "") });
          } else if (block.type === "thinking") {
            this.emit({ type: "thinking", text: String(block.thinking ?? "") });
          } else if (block.type === "tool_use") {
            this.emit({
              type: "tool_use",
              tool: String(block.name ?? "tool"),
              input: block.input ?? {},
              id: String(block.id ?? ""),
            });
          }
        }
        break;
      }
      case "user": {
        const content = (msg as { message?: { content?: unknown[] } }).message?.content ?? [];
        for (const block of content as Array<Record<string, unknown>>) {
          if (block.type === "tool_result") {
            const raw = block.content;
            const summary =
              typeof raw === "string"
                ? raw
                : Array.isArray(raw)
                  ? raw
                      .map((p) => (p && typeof p === "object" && "text" in p ? String((p as { text: unknown }).text) : ""))
                      .join("")
                  : "";
            this.emit({
              type: "tool_result",
              id: String(block.tool_use_id ?? ""),
              isError: Boolean(block.is_error),
              summary: summary.slice(0, 2000),
            });
          }
        }
        break;
      }
      case "result": {
        await this.onTurnResult(msg as Record<string, unknown>);
        break;
      }
      default:
        break;
    }
  }

  private async onTurnResult(msg: Record<string, unknown>): Promise<void> {
    const cost = Number(msg.total_cost_usd ?? 0);
    const durationMs = Number(msg.duration_ms ?? 0);
    const numTurns = Number(msg.num_turns ?? 0);
    const subtype = String(msg.subtype ?? "success");
    this.totalCostUsd = cost; // cumulative across the streaming session

    const instr = this.currentInstruction;
    this.emit({
      type: "result",
      subtype,
      costUsd: cost,
      durationMs,
      numTurns,
      instructionId: instr?.id ?? null,
    });

    // Subscription usage-limit hit → pause and ask the user (notify & choose).
    if (
      subtype !== "success" &&
      this.effectiveMode() === "subscription" &&
      isUsageLimit(msg)
    ) {
      this.limitedInstruction = instr;
      this.currentInstruction = null;
      if (instr?.id) {
        await prisma.instruction
          .update({ where: { id: instr.id }, data: { status: "pending" } })
          .catch(() => undefined);
        this.emit({ type: "instruction_status", instructionId: instr.id, status: "pending" });
      }
      this.setStatus("limit_paused");
      this.emit({
        type: "limit_reached",
        detail:
          "Your Max plan usage limit was reached. Continue this work on the API key, or wait for the limit to reset.",
      });
      return;
    }

    // Mark the just-finished instruction done.
    if (instr?.id) {
      const status = subtype === "success" ? "done" : "failed";
      await prisma.instruction
        .update({ where: { id: instr.id }, data: { status, costUsd: cost } })
        .catch(() => undefined);
      this.emit({ type: "instruction_status", instructionId: instr.id, status, costUsd: cost });
    }
    if (this.sessionDbId) {
      await prisma.session
        .update({ where: { id: this.sessionDbId }, data: { totalCostUsd: cost } })
        .catch(() => undefined);
    }

    // Git/PR flow for this instruction.
    await this.handleGitForInstruction().catch((e) => {
      this.emit({ type: "log", level: "warn", text: `Git/PR step failed: ${(e as Error).message}` });
      void recordError({
        errorType: ErrorType.AGENT_GIT_PR_FAILURE,
        error: e,
        project: this.projectId,
        context: { branchName: this.branchName, prNumber: this.prNumber, mergePolicy: this.mergePolicy },
      });
    });

    this.currentInstruction = null;

    // Cost ceiling.
    if (this.totalCostUsd >= env.sessionCostLimitUsd) {
      this.emit({
        type: "log",
        level: "warn",
        text: `Cost limit reached ($${this.totalCostUsd.toFixed(2)} ≥ $${env.sessionCostLimitUsd}). Stopping.`,
      });
      await this.stop();
      return;
    }

    this.sendNext();
  }

  /** Open a PR (once) and merge per the configured policy. */
  private async handleGitForInstruction(): Promise<void> {
    if (this.mergePolicy === "MANUAL") return;
    const [owner, repo] = await this.repoFullName();
    const hasCommits = await this.repo.hasCommitsAhead(this.branchName);
    if (!hasCommits) return;

    // Ensure branch is pushed (agent should have pushed, but be safe).
    await this.repo.push(this.branchName).catch(() => undefined);

    if (this.prNumber === null) {
      this.prNumber = await openPullRequest(
        this.userId,
        owner,
        repo,
        this.branchName,
        this.defaultBranchName(),
        `Foreman: ${this.branchName}`,
        "Automated changes by the Foreman orchestrator.",
        this.mergePolicy === "PER_SESSION",
      );
      if (this.sessionDbId) {
        await prisma.session
          .update({ where: { id: this.sessionDbId }, data: { prNumber: this.prNumber } })
          .catch(() => undefined);
      }
      this.emit({ type: "git", action: "pr", detail: `Opened PR #${this.prNumber}` });
    }

    if (this.mergePolicy === "PER_INSTRUCTION" && this.prNumber !== null) {
      await mergePullRequest(this.userId, owner, repo, this.prNumber, "squash");
      this.emit({ type: "git", action: "merge", detail: `Merged PR #${this.prNumber} into main` });
      this.prNumber = null; // next instruction opens a fresh PR off updated main
    }
  }

  private sendNext(): void {
    if (this.stopped) return;
    const next = this.queue.shift();
    if (!next) {
      this.setStatus("completed");
      void this.maybeMergeAtEnd();
      return;
    }
    this.currentInstruction = next;
    this.setStatus("running");
    if (next.id) {
      this.emit({ type: "instruction_status", instructionId: next.id, status: "running" });
      void prisma.instruction
        .update({ where: { id: next.id }, data: { status: "running" } })
        .catch(() => undefined);
    }
    void this.dispatchInstruction(next);
  }

  /** Build and push the user message for an instruction, after staging any
   *  attached files to disk. Order is preserved because the consume loop only
   *  calls sendNext again after the prior turn's `result`. */
  private async dispatchInstruction(next: QueuedInstruction): Promise<void> {
    let note = "";
    if (next.id) {
      try {
        const files = await this.materializeAttachments(next.id);
        if (files.length) {
          note =
            "Attached files for this instruction (absolute paths on disk — NOT in the git repo):\n" +
            files.map((f) => `- ${f.path} (${f.mimeType})`).join("\n") +
            "\nRead them with your file tools and use them exactly as the instruction directs. " +
            "If a file should become part of the project, copy it into the repo yourself.";
        }
      } catch (e) {
        this.emit({ type: "log", level: "warn", text: `Failed to stage attachments: ${(e as Error).message}` });
      }
    }
    if (this.stopped) return;
    const message = buildInstructionMessage(next.text, this.sentCount, this.total, note);
    this.sentCount += 1;
    this.inbox.push({
      type: "user",
      session_id: this.sdkSessionId ?? "",
      message: { role: "user", content: message },
      parent_tool_use_id: null,
    });
  }

  /** Write an instruction's attachments to a per-instruction dir OUTSIDE the
   *  git repo so they don't get accidentally committed, and return their paths. */
  private async materializeAttachments(
    instructionId: string,
  ): Promise<Array<{ path: string; mimeType: string; filename: string }>> {
    const atts = await prisma.instructionAttachment.findMany({ where: { instructionId } });
    if (atts.length === 0) return [];
    const dir = path.resolve(env.workspacesDir, `${this.projectId}__attachments`, instructionId);
    fs.mkdirSync(dir, { recursive: true });
    const out: Array<{ path: string; mimeType: string; filename: string }> = [];
    for (const a of atts) {
      const safe = path.basename(a.filename).replace(/[^a-zA-Z0-9._-]/g, "_") || "file";
      const p = path.join(dir, safe);
      fs.writeFileSync(p, Buffer.from(a.data, "base64"));
      out.push({ path: p, mimeType: a.mimeType, filename: safe });
    }
    return out;
  }

  private async maybeMergeAtEnd(): Promise<void> {
    if (this.mergePolicy === "PER_SESSION" && this.prNumber !== null) {
      const [owner, repo] = await this.repoFullName();
      await mergePullRequest(this.userId, owner, repo, this.prNumber, "squash").catch((e) => {
        this.emit({ type: "log", level: "warn", text: `Final merge failed: ${(e as Error).message}` });
        void recordError({
          errorType: ErrorType.AGENT_GIT_MERGE_FAILURE,
          error: e,
          project: this.projectId,
          context: { prNumber: this.prNumber, branchName: this.branchName },
        });
      });
      this.emit({ type: "git", action: "merge", detail: `Merged PR #${this.prNumber} into main` });
    }

    // After the final merge, verify the deployment succeeded. If a fix was
    // injected, the run continues instead of finalizing now.
    const resumed = await this.autoRailwayDeployCheck();
    if (resumed) return;

    await this.finalize();
  }

  /**
   * End-of-session deploy verification. After all instructions have run and
   * merged, wait a fixed window for Railway to build + deploy the new code,
   * then pull the latest deployment status. On failure, grab the logs and
   * inject a fix instruction so the session self-heals. Returns true if a fix
   * was queued (the run should continue rather than finalize).
   */
  private async autoRailwayDeployCheck(): Promise<boolean> {
    if (this.stopped) return false;
    // Nothing reached main under MANUAL, so there's no new deploy to check.
    if (this.mergePolicy === "MANUAL") return false;

    if (this.railwayAutoFixAttempts >= AgentSession.MAX_RAILWAY_AUTOFIX) {
      this.emit({
        type: "log",
        level: "warn",
        text: `Railway deploy still not healthy after ${AgentSession.MAX_RAILWAY_AUTOFIX} auto-fix attempts — stopping auto-heal. Use the ↻ Railway button to retry.`,
      });
      return false;
    }

    // Only auto-check projects EXPLICITLY linked to a Railway service (the
    // per-project ↻ Railway target). Static sites (e.g. GitHub Pages) are never
    // linked, so they're skipped — and we deliberately do NOT fall back to the
    // account-wide Railway default, which would wrongly match unrelated projects.
    const linked = await prisma.project.findUnique({
      where: { id: this.projectId },
      select: { railwayProjectId: true },
    });
    if (!linked?.railwayProjectId) return false;

    // Probe: confirm Railway is reachable before burning the 5-minute wait.
    try {
      await fetchLatestLogs(this.userId, this.projectId);
    } catch (e) {
      this.emit({
        type: "log",
        level: "info",
        text: `Skipped Railway deploy check: ${(e as Error).message}`,
      });
      return false;
    }

    const mins = Math.round(AgentSession.DEPLOY_WAIT_MS / 60000);
    // Keep the session "running" while we wait so the chip isn't prematurely
    // "completed" and the Stop button stays available.
    this.setStatus("running");
    this.emit({
      type: "log",
      level: "info",
      text: `All instructions complete and merged to main. Waiting ${mins} minutes for the Railway deployment to build and go live before checking for errors…`,
    });

    await this.sleep(AgentSession.DEPLOY_WAIT_MS);
    if (this.stopped) return false;

    let result: Awaited<ReturnType<typeof fetchLatestLogs>>;
    try {
      result = await fetchLatestLogs(this.userId, this.projectId);
    } catch (e) {
      // Railway became unreachable mid-wait — don't block finalize.
      this.emit({
        type: "log",
        level: "info",
        text: `Skipped Railway deploy check: ${(e as Error).message}`,
      });
      this.setStatus("completed");
      return false;
    }

    if (!result.failed) {
      this.emit({
        type: "log",
        level: "info",
        text: `Railway deployment status: ${result.status ?? "unknown"} — no errors detected. ✅`,
      });
      this.setStatus("completed");
      return false;
    }

    // Deployment failed → pull logs and inject a fix; the loop resumes.
    this.railwayAutoFixAttempts += 1;
    const body = result.logs
      .map((l) => `${l.severity ?? "info"}: ${l.message}`)
      .join("\n")
      .slice(0, 6000);
    this.emit({
      type: "log",
      level: "error",
      text: `Railway deployment ${result.status ?? "FAILED"} — pulling logs and injecting a fix (auto-fix ${this.railwayAutoFixAttempts}/${AgentSession.MAX_RAILWAY_AUTOFIX}).`,
    });
    this.injectRailwayFix(result.status ?? "FAILED", body);
    return true;
  }

  /** Resolve after `ms`, returning early if the session is stopped. */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const t = setTimeout(resolve, ms);
      // Don't keep the event loop alive solely for this timer.
      (t as { unref?: () => void }).unref?.();
    });
  }

  /** Append an instruction to a still-running session (e.g. user adds one, or Railway self-heal). */
  enqueue(text: string, id: string | null = null): void {
    this.queue.push({ id, text });
    this.total += 1;
    // If idle/completed and not currently running an instruction, kick it.
    if (!this.currentInstruction && !this.stopped) {
      if (this.status === "completed") this.setStatus("idle");
      this.sendNext();
    }
  }

  /** Inject a Railway-failure fix instruction. */
  injectRailwayFix(status: string, logs: string): void {
    this.enqueue(buildRailwayFixMessage(status, logs), null);
  }

  /**
   * Resolve a subscription usage-limit pause. "api" tears down the subscription
   * query and resumes the interrupted instruction on the API key; "wait" stops
   * the session so it can be re-run later (on the subscription) after a reset.
   */
  async resolveLimit(choice: "api" | "wait"): Promise<void> {
    if (this.status !== "limit_paused") return;

    if (choice === "wait") {
      this.emit({ type: "log", level: "info", text: "Waiting for the Max limit to reset. Re-run when ready." });
      await this.stop();
      return;
    }

    // Switch to API-key auth: rebuild the SDK query with a fresh environment.
    this.apiKeyOverride = true;
    this.emit({ type: "log", level: "warn", text: "Continuing on the API key (pay-as-you-go)." });
    try {
      this.inbox.end();
      await this.q?.return?.(undefined);
    } catch {
      /* ignore */
    }
    this.inbox = new AsyncInbox<SDKUserMessage>();
    this.startConsumeLoop();

    const retry = this.limitedInstruction;
    this.limitedInstruction = null;
    if (retry) this.queue.unshift(retry);
    this.sendNext();
  }

  async stop(): Promise<void> {
    if (this.stopped) return;
    this.stopped = true;
    this.setStatus("stopped");
    try {
      await this.q?.interrupt?.();
    } catch {
      /* ignore */
    }
    this.inbox.end();
    await this.finalize();
  }

  private async finalize(): Promise<void> {
    try {
      this.inbox.end();
      await this.q?.return?.(undefined);
    } catch {
      /* ignore */
    }
    if (this.sessionDbId) {
      await prisma.session
        .update({ where: { id: this.sessionDbId }, data: { endedAt: new Date() } })
        .catch(() => undefined);
    }
  }

  // ─── helpers ──────────────────────────────────────────────────────────────

  private cachedFullName: [string, string] | null = null;
  private cachedDefaultBranch = "main";

  private async repoFullName(): Promise<[string, string]> {
    if (this.cachedFullName) return this.cachedFullName;
    const project = await prisma.project.findUnique({ where: { id: this.projectId } });
    if (!project) throw new Error("Project not found.");
    this.cachedFullName = [project.repoOwner, project.repoName];
    this.cachedDefaultBranch = project.defaultBranch;
    return this.cachedFullName;
  }

  private defaultBranchName(): string {
    return this.cachedDefaultBranch;
  }

  snapshot() {
    return {
      sessionId: this.sessionDbId,
      branchName: this.branchName,
      status: this.status as string,
      prNumber: this.prNumber,
      totalCostUsd: this.totalCostUsd,
    };
  }
}
