import { query } from "@anthropic-ai/claude-agent-sdk";
import { env } from "../env.js";

/**
 * Real test of the Max subscription auth: run a minimal Claude Code call using
 * ONLY the CLAUDE_CODE_OAUTH_TOKEN (with ANTHROPIC_API_KEY removed from the
 * call's environment), so a success proves the subscription token actually
 * works — not that it silently fell back to the API key.
 *
 * This spawns a short-lived Claude Code subprocess and uses a tiny bit of your
 * plan's usage, so it's an explicit on-demand action, not part of the bulk test.
 */
export async function testClaudeSubscription(): Promise<{ ok: boolean; detail: string }> {
  if (!env.claudeCodeOauthToken) {
    return { ok: false, detail: "CLAUDE_CODE_OAUTH_TOKEN is not set on the service." };
  }

  let q: ReturnType<typeof query> | null = null;
  let stderr = "";
  try {
    q = query({
      prompt: "Reply with exactly: OK",
      options: {
        // Only force a model if one is explicitly configured; otherwise let the
        // Claude Code CLI use its default (an invalid model id exits the process).
        ...(env.agentModel ? { model: env.agentModel } : {}),
        maxTurns: 1,
        permissionMode: "bypassPermissions",
        stderr: (d: string) => {
          stderr += d;
        },
        // Isolate subscription auth: only the OAuth token, no API key fallback.
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: undefined,
          CLAUDE_CODE_OAUTH_TOKEN: env.claudeCodeOauthToken,
        } as Record<string, string | undefined>,
      },
    });

    const consume = (async () => {
      for await (const msg of q!) {
        const m = msg as { type: string; subtype?: string };
        if (m.type === "result") return m.subtype === "success";
      }
      return false;
    })();

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Test timed out after 60s.")), 60000),
    );

    const ok = await Promise.race([consume, timeout]);
    return ok
      ? { ok: true, detail: "Subscription token valid — a test call succeeded on your Max plan." }
      : { ok: false, detail: "Test call finished without success (token may be invalid/expired)." };
  } catch (e) {
    const tail = stderr.trim().split("\n").slice(-6).join("\n").slice(0, 600);
    const detail = tail ? `${(e as Error).message} — ${tail}` : (e as Error).message;
    return { ok: false, detail };
  } finally {
    try {
      await q?.return?.(undefined);
    } catch {
      /* ignore */
    }
  }
}
