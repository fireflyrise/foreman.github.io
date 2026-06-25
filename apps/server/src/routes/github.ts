import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { getUserId, requireAuth } from "../auth.js";
import { env } from "../env.js";
import { recordError } from "../errors/store.js";
import { ErrorType } from "../errors/types.js";
import {
  exchangeCodeForToken,
  githubAuthorizeUrl,
  listRepos,
  persistGithubToken,
} from "../integrations/github.js";

// Short-lived in-memory OAuth state store (CSRF protection).
const pendingStates = new Map<string, number>();
function newState(): string {
  const s = crypto.randomBytes(16).toString("hex");
  pendingStates.set(s, Date.now());
  // GC old states (>10 min).
  for (const [k, t] of pendingStates) if (Date.now() - t > 600_000) pendingStates.delete(k);
  return s;
}

export async function githubRoutes(app: FastifyInstance): Promise<void> {
  // Step 1: redirect to GitHub authorize.
  app.get("/api/github/login", { preHandler: requireAuth }, async (_req, reply) => {
    if (!env.githubClientId) return reply.code(400).send({ error: "GitHub OAuth not configured" });
    const state = newState();
    return reply.redirect(githubAuthorizeUrl(state));
  });

  // Step 2: OAuth callback (no auth preHandler — GitHub calls this; we validate state).
  app.get("/api/github/callback", async (req, reply) => {
    const { code, state } = req.query as { code?: string; state?: string };
    if (!code || !state || !pendingStates.has(state)) {
      return reply.code(400).send("Invalid OAuth state.");
    }
    pendingStates.delete(state);
    try {
      const token = await exchangeCodeForToken(code);
      // Single-user app: associate with the configured user.
      const { getOrCreateSingleUser } = await import("../db.js");
      const userId = await getOrCreateSingleUser(env.authUsername);
      await persistGithubToken(userId, token);
      return reply.redirect(`${env.webRedirect()}?github=connected`);
    } catch (err) {
      void recordError({
        errorType: ErrorType.GITHUB_OAUTH_CALLBACK_FAILURE,
        error: err,
        project: "github-oauth",
      });
      return reply.code(500).send(`GitHub connect failed: ${(err as Error).message}`);
    }
  });

  app.get("/api/github/repos", { preHandler: requireAuth }, async (req, reply) => {
    try {
      const repos = await listRepos(getUserId(req));
      return { repos };
    } catch (err) {
      void recordError({
        errorType: ErrorType.GITHUB_REPO_LIST_FAILURE,
        error: err,
        project: "github",
      });
      return reply.code(400).send({ error: (err as Error).message });
    }
  });
}
