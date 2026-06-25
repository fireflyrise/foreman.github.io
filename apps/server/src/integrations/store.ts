import type { IntegrationProvider } from "@foreman/shared";
import { prisma } from "../db.js";
import { decryptJson, encryptJson } from "../crypto/secrets.js";

/**
 * Stores/loads encrypted per-provider credentials for the single user.
 * `meta` holds non-secret display info (e.g. github login, railway ids).
 */
export async function saveCredential(
  userId: string,
  provider: IntegrationProvider,
  secret: unknown,
  meta: Record<string, unknown> = {},
): Promise<void> {
  const encBlob = encryptJson(secret);
  await prisma.integration.upsert({
    where: { userId_provider: { userId, provider } },
    create: { userId, provider, encBlob, meta: meta as object },
    update: { encBlob, meta: meta as object },
  });
}

export async function loadCredential<T = unknown>(
  userId: string,
  provider: IntegrationProvider,
): Promise<T | null> {
  const row = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider } },
  });
  if (!row) return null;
  return decryptJson<T>(row.encBlob);
}

export async function getMeta(
  userId: string,
  provider: IntegrationProvider,
): Promise<Record<string, unknown> | null> {
  const row = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider } },
  });
  return row ? (row.meta as Record<string, unknown>) : null;
}

export async function updateMeta(
  userId: string,
  provider: IntegrationProvider,
  meta: Record<string, unknown>,
): Promise<void> {
  await prisma.integration.update({
    where: { userId_provider: { userId, provider } },
    data: { meta: meta as object },
  });
}

export async function isConnected(
  userId: string,
  provider: IntegrationProvider,
): Promise<boolean> {
  const row = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider } },
    select: { id: true },
  });
  return !!row;
}
