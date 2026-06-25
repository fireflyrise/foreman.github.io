import type { WebCreatorInput } from "@foreman/shared";
import { prisma } from "./db.js";

/**
 * Persist the full Web Creator intake: a few hot fields live in columns; the
 * complete validated object is stored in `details` so nothing is lost.
 */
export async function saveWebSpec(
  projectId: string,
  input: WebCreatorInput,
): Promise<void> {
  const columns = {
    companyName: input.companyName,
    industry: input.industry,
    accentHex: input.accentHex,
    logoUrl: input.logoUrl ?? null,
    logoPrompt: input.logoPrompt ?? null,
    goal: input.goal,
    details: input as object,
  };
  await prisma.webCreatorSpec.upsert({
    where: { projectId },
    create: { projectId, ...columns },
    update: columns,
  });
}
