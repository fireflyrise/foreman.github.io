import type { FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcryptjs";
import { env } from "./env.js";
import { getOrCreateSingleUser } from "./db.js";

const COOKIE_NAME = "fmn_session";

export async function verifyLogin(username: string, password: string): Promise<boolean> {
  if (username !== env.authUsername) return false;
  if (!env.authPasswordHash) {
    // First-run convenience in development only: allow a default password.
    if (!env.isProd && password === "admin") return true;
    return false;
  }
  return bcrypt.compare(password, env.authPasswordHash);
}

export function setSessionCookie(reply: FastifyReply): void {
  reply.setCookie(COOKIE_NAME, env.authUsername, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd,
    signed: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(COOKIE_NAME, { path: "/" });
}

/** Fastify preHandler: rejects unauthenticated requests, attaches userId. */
export async function requireAuth(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const raw = req.cookies[COOKIE_NAME];
  if (!raw) {
    await reply.code(401).send({ error: "Not authenticated" });
    return;
  }
  const unsigned = req.unsignCookie(raw);
  if (!unsigned.valid || unsigned.value !== env.authUsername) {
    await reply.code(401).send({ error: "Not authenticated" });
    return;
  }
  (req as FastifyRequest & { userId: string }).userId =
    await getOrCreateSingleUser(env.authUsername);
}

export function getUserId(req: FastifyRequest): string {
  return (req as FastifyRequest & { userId: string }).userId;
}
