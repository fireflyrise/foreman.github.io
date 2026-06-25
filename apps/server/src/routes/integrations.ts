import type { FastifyInstance } from "fastify";
import type { IntegrationProvider, IntegrationStatusDTO } from "@foreman/shared";
import { GenerateLogoInput, SaveGeminiInput, SaveRailwayInput } from "@foreman/shared";
import { getUserId, requireAuth } from "../auth.js";
import { getMeta, isConnected } from "../integrations/store.js";
import { saveRailway } from "../integrations/railway.js";
import { generateLogo, saveGemini } from "../integrations/gemini.js";
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

  // Railway: save token + ids.
  app.put("/api/integrations/railway", async (req, reply) => {
    const parsed = SaveRailwayInput.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
    await saveRailway(getUserId(req), parsed.data);
    return { ok: true };
  });

  // Gemini: save API key.
  app.put("/api/integrations/gemini", async (req, reply) => {
    const parsed = SaveGeminiInput.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
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
