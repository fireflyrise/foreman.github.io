import type { FastifyInstance } from "fastify";
import type { IntegrationProvider, IntegrationStatusDTO } from "@foreman/shared";
import { GenerateLogoInput, SaveGeminiInput, SaveRailwayInput } from "@foreman/shared";
import { getUserId, requireAuth } from "../auth.js";
import { getMeta, isConnected } from "../integrations/store.js";
import { saveRailway, verifyRailwayToken } from "../integrations/railway.js";
import { generateLogo, saveGemini, verifyGeminiKey } from "../integrations/gemini.js";
import { testAllIntegrations } from "../integrations/test.js";
import { testClaudeSubscription } from "../integrations/testSubscription.js";
import { env } from "../env.js";
import { recordError } from "../errors/store.js";
import { ErrorType } from "../errors/types.js";

export async function integrationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", requireAuth);

  // Connection status for all providers (drives the UI status chips).
  app.get("/api/integrations", async (req) => {
    const userId = getUserId(req);
    const providers: IntegrationProvider[] = ["GITHUB", "RAILWAY", "GEMINI"];
    const statuses: IntegrationStatusDTO[] = [];
    for (const provider of providers) {
      const connected = await isConnected(userId, provider);
      const meta = (await getMeta(userId, provider)) ?? {};
      statuses.push({ provider, connected, meta });
    }
    // Anthropic auth is server-side env. Report both credential paths:
    // API key (Module 2 / client work) and Max subscription token (Module 1).
    statuses.push({
      provider: "ANTHROPIC",
      connected: Boolean(env.anthropicApiKey) || Boolean(env.claudeCodeOauthToken),
      meta: {
        apiKey: Boolean(env.anthropicApiKey),
        subscription: Boolean(env.claudeCodeOauthToken),
      },
    });
    return { integrations: statuses };
  });

  // Live connection test: actually calls each provider's API.
  app.get("/api/integrations/test", async (req) => {
    const results = await testAllIntegrations(getUserId(req));
    return { results };
  });

  // Real Max-subscription test: runs a tiny Claude Code call on the OAuth token.
  app.post("/api/integrations/test-subscription", async () => {
    const result = await testClaudeSubscription();
    return { result };
  });

  // Railway: best-effort verify, then save. We do NOT hard-reject, because a
  // valid token scoped to a workspace can fail the standalone identity check
  // while still working for the deployment-log queries. The real functional
  // test is the per-project ↻ Railway button / Test connections.
  app.put("/api/integrations/railway", async (req, reply) => {
    const parsed = SaveRailwayInput.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
    let warning: string | undefined;
    try {
      await verifyRailwayToken(parsed.data.token);
    } catch (err) {
      warning =
        `Saved, but couldn't verify the token (${(err as Error).message}). ` +
        `If it's a workspace-scoped token this can be normal — confirm with Test connections ` +
        `or the ↻ Railway button on a project.`;
    }
    await saveRailway(getUserId(req), parsed.data);
    return { ok: true, warning };
  });

  // Gemini: validate the key against the API, then save.
  app.put("/api/integrations/gemini", async (req, reply) => {
    const parsed = SaveGeminiInput.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
    try {
      await verifyGeminiKey(parsed.data.apiKey);
    } catch (err) {
      return reply.code(400).send({ error: `Gemini key rejected: ${(err as Error).message}` });
    }
    await saveGemini(getUserId(req), parsed.data.apiKey);
    return { ok: true };
  });

  // Generate a logo (returns a data URL the UI can preview & save into a spec).
  app.post("/api/integrations/gemini/logo", async (req, reply) => {
    const parsed = GenerateLogoInput.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
    try {
      const logo = await generateLogo(getUserId(req), parsed.data.prompt, {
        companyName: parsed.data.companyName,
        accentHex: parsed.data.accentHex,
      });
      return { logo };
    } catch (err) {
      void recordError({
        errorType: ErrorType.GEMINI_LOGO_FAILURE,
        error: err,
        project: "gemini",
        context: { companyName: parsed.data.companyName },
      });
      return reply.code(400).send({ error: (err as Error).message });
    }
  });
}
