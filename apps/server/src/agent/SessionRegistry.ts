import type { AuthMode } from "@foreman/shared";
import type { GoalContext } from "./prompts.js";
import { AgentSession } from "./AgentSession.js";
import { env } from "../env.js";
import { prisma } from "../db.js";

interface StartParams {
  projectId: string;
  userId: string;
  /** Defaults to "subscription" (Module 1); Web Creator passes "api". */
  authMode?: AuthMode;
  /** Overrides the project's Module 1 goal (Web Creator passes the site goal). */
  goalOverride?: GoalContext;
}

/**
 * Process-wide registry of live AgentSessions, keyed by projectId. Enforces a
 * concurrency cap so we don't spawn unbounded Claude Code subprocesses.
 */
class SessionRegistryImpl {
  private sessions = new Map<string, AgentSession>();

  get(projectId: string): AgentSession | undefined {
    return this.sessions.get(projectId);
  }

  isRunning(projectId: string): boolean {
    const s = this.sessions.get(projectId);
    return !!s && s.status !== "stopped" && s.status !== "completed" && s.status !== "error";
  }

  private activeCount(): number {
    let n = 0;
    for (const s of this.sessions.values()) {
      if (s.status === "running" || s.status === "awaiting_next" || s.status === "idle") n += 1;
    }
    return n;
  }

  async start({
    projectId,
    userId,
    authMode = "subscription",
    goalOverride,
  }: StartParams): Promise<AgentSession> {
    const existing = this.sessions.get(projectId);
    if (existing && this.isRunning(projectId)) {
      throw new Error("A session is already running for this project.");
    }
    if (this.activeCount() >= env.maxConcurrentSessions) {
      throw new Error(
        `Maximum concurrent sessions (${env.maxConcurrentSessions}) reached. Stop another project first.`,
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { goal: true, instructions: { orderBy: { order: "asc" } } },
    });
    if (!project) throw new Error("Project not found.");

    const pending = project.instructions.filter((i) => i.status !== "done");
    if (pending.length === 0) {
      throw new Error("No pending instructions to run.");
    }

    const goal: GoalContext = goalOverride ?? {
      mainGoal: project.goal?.mainGoal ?? "",
      limitations: project.goal?.limitations ?? "",
      reasoning: project.goal?.reasoning ?? "",
    };

    const session = new AgentSession({
      projectId,
      userId,
      repoOwner: project.repoOwner,
      repoName: project.repoName,
      defaultBranch: project.defaultBranch,
      mergePolicy: project.mergePolicy,
      goal,
      instructions: pending.map((i) => ({ id: i.id, text: i.text })),
      authMode,
    });

    this.sessions.set(projectId, session);
    await session.start();
    return session;
  }

  async stop(projectId: string): Promise<void> {
    const session = this.sessions.get(projectId);
    if (session) {
      await session.stop();
      return;
    }
    // No live session (e.g. the server restarted and lost it). Mark any
    // non-terminal DB row for this project as stopped so the UI can recover —
    // otherwise the console stays stuck on "running" with a dead Stop button.
    await prisma.session
      .updateMany({
        where: { projectId, status: { notIn: ["stopped", "completed", "error"] } },
        data: { status: "stopped", endedAt: new Date() },
      })
      .catch(() => undefined);
  }

  /**
   * On boot, reconcile sessions that were "running" when the process died. In-
   * memory sessions don't survive a restart (crash-resume isn't wired yet), so
   * any non-terminal row is orphaned — mark it stopped so the UI isn't stuck.
   */
  async reconcileOnBoot(): Promise<void> {
    await prisma.session
      .updateMany({
        where: { status: { notIn: ["stopped", "completed", "error"] } },
        data: { status: "stopped", endedAt: new Date() },
      })
      .catch(() => undefined);
  }

  async resolveLimit(projectId: string, choice: "api" | "wait"): Promise<void> {
    const session = this.sessions.get(projectId);
    if (session) await session.resolveLimit(choice);
  }
}

export const SessionRegistry = new SessionRegistryImpl();
