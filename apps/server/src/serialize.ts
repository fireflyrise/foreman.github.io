import type {
  GoalDTO,
  InstructionDTO,
  MergePolicy,
  ProjectDTO,
  SessionDTO,
  WebCreatorSpecDTO,
} from "@foreman/shared";
import { WebCreatorInput } from "@foreman/shared";
import type {
  Goal,
  Instruction,
  InstructionAttachment,
  Project,
  Session,
  WebCreatorSpec,
} from "@prisma/client";
import { SessionRegistry } from "./agent/SessionRegistry.js";

export function serializeGoal(goal: Goal | null): GoalDTO | null {
  if (!goal) return null;
  return {
    mainGoal: goal.mainGoal,
    limitations: goal.limitations,
    reasoning: goal.reasoning,
    updatedAt: goal.updatedAt.toISOString(),
  };
}

export function serializeInstruction(
  i: Instruction & { attachments?: InstructionAttachment[] },
): InstructionDTO {
  return {
    id: i.id,
    order: i.order,
    text: i.text,
    status: i.status as InstructionDTO["status"],
    costUsd: i.costUsd,
    // Metadata only — never ship the base64 payload to the list view.
    attachments: (i.attachments ?? []).map((a) => ({
      id: a.id,
      filename: a.filename,
      mimeType: a.mimeType,
    })),
  };
}

export function serializeSession(s: Session): SessionDTO {
  return {
    id: s.id,
    branchName: s.branchName,
    status: s.status as SessionDTO["status"],
    prNumber: s.prNumber,
    totalCostUsd: s.totalCostUsd,
    startedAt: s.startedAt.toISOString(),
    endedAt: s.endedAt ? s.endedAt.toISOString() : null,
  };
}

export function serializeWebSpec(w: WebCreatorSpec | null): WebCreatorSpecDTO | null {
  if (!w) return null;
  // `details` holds the full intake; columns are the authoritative overrides.
  const details = (w.details ?? {}) as Record<string, unknown>;
  const merged = {
    ...details,
    goal: w.goal,
    companyName: w.companyName,
    industry: w.industry,
    accentHex: w.accentHex,
    logoUrl: w.logoUrl,
    logoPrompt: w.logoPrompt,
  };
  // safeParse fills defaults for any fields missing on older rows.
  const parsed = WebCreatorInput.safeParse(merged);
  return parsed.success ? parsed.data : (merged as WebCreatorSpecDTO);
}

type ProjectWithRelations = Project & {
  goal: Goal | null;
  instructions: Array<Instruction & { attachments?: InstructionAttachment[] }>;
  sessions: Session[];
  webSpec: WebCreatorSpec | null;
};

export function serializeProject(p: ProjectWithRelations): ProjectDTO {
  const live = SessionRegistry.get(p.id);
  const activeSession =
    p.sessions.length > 0 ? serializeSession(p.sessions[0]!) : null;
  if (activeSession && live) {
    const snap = live.snapshot();
    activeSession.status = snap.status as SessionDTO["status"];
    activeSession.totalCostUsd = snap.totalCostUsd;
    activeSession.prNumber = snap.prNumber;
  }
  return {
    id: p.id,
    name: p.name,
    repoOwner: p.repoOwner,
    repoName: p.repoName,
    repoFullName: p.repoFullName,
    defaultBranch: p.defaultBranch,
    projectType: p.projectType as ProjectDTO["projectType"],
    mergePolicy: p.mergePolicy as MergePolicy,
    authMode: p.authMode as ProjectDTO["authMode"],
    webAuthMode: p.webAuthMode as ProjectDTO["webAuthMode"],
    railwayProjectId: p.railwayProjectId,
    railwayServiceId: p.railwayServiceId,
    railwayEnvironmentId: p.railwayEnvironmentId,
    createdAt: p.createdAt.toISOString(),
    goal: serializeGoal(p.goal),
    instructions: p.instructions
      .sort((a, b) => a.order - b.order)
      .map(serializeInstruction),
    activeSession,
    webSpec: serializeWebSpec(p.webSpec),
  };
}
