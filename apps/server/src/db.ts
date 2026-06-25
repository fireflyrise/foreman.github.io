import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

/**
 * The app is single-user. We lazily ensure exactly one User row exists and
 * return it; everything (projects, integrations) hangs off this user.
 */
let cachedUserId: string | null = null;

export async function getOrCreateSingleUser(username: string): Promise<string> {
  if (cachedUserId) return cachedUserId;
  const user = await prisma.user.upsert({
    where: { username },
    create: { username },
    update: {},
  });
  cachedUserId = user.id;
  return user.id;
}
