import type { FastifyInstance } from "fastify";
import { LoginInput } from "@foreman/shared";
import {
  clearSessionCookie,
  requireAuth,
  setSessionCookie,
  verifyLogin,
} from "../auth.js";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/login", async (req, reply) => {
    const parsed = LoginInput.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
    const ok = await verifyLogin(parsed.data.username, parsed.data.password);
    if (!ok) return reply.code(401).send({ error: "Invalid credentials" });
    setSessionCookie(reply);
    return { ok: true };
  });

  app.post("/api/logout", async (_req, reply) => {
    clearSessionCookie(reply);
    return { ok: true };
  });

  app.get("/api/me", { preHandler: requireAuth }, async () => {
    return { authenticated: true };
  });
}
