import { z } from "zod";

/** Integration providers whose credentials we store (encrypted). */
export const IntegrationProvider = z.enum([
  "GITHUB",
  "RAILWAY",
  "GEMINI",
  "ANTHROPIC",
]);
export type IntegrationProvider = z.infer<typeof IntegrationProvider>;

/** How finished work reaches `main`. */
export const MergePolicy = z.enum([
  "PER_INSTRUCTION", // merge the session branch after each instruction completes
  "PER_SESSION", // open one PR and merge once at the end of the session
  "MANUAL", // never auto-merge; leave the PR open
]);
export type MergePolicy = z.infer<typeof MergePolicy>;

export const InstructionStatus = z.enum([
  "pending",
  "running",
  "done",
  "failed",
  "skipped",
]);
export type InstructionStatus = z.infer<typeof InstructionStatus>;

export const SessionStatus = z.enum([
  "idle", // session open, no instruction currently running
  "running", // an instruction is executing
  "awaiting_next", // finished one, about to send the next
  "stopped",
  "error",
  "completed", // queue drained successfully
]);
export type SessionStatus = z.infer<typeof SessionStatus>;

// ─── DTOs returned to the frontend ──────────────────────────────────────────

export interface ProjectDTO {
  id: string;
  name: string;
  repoOwner: string;
  repoName: string;
  repoFullName: string;
  defaultBranch: string;
  mergePolicy: MergePolicy;
  railwayProjectId: string | null;
  railwayServiceId: string | null;
  railwayEnvironmentId: string | null;
  createdAt: string;
  goal: GoalDTO | null;
  instructions: InstructionDTO[];
  activeSession: SessionDTO | null;
  webSpec: WebCreatorSpecDTO | null;
}

export interface GoalDTO {
  mainGoal: string;
  limitations: string;
  reasoning: string;
  updatedAt: string;
}

export interface InstructionDTO {
  id: string;
  order: number;
  text: string;
  status: InstructionStatus;
  costUsd: number | null;
}

export interface SessionDTO {
  id: string;
  branchName: string;
  status: SessionStatus;
  prNumber: number | null;
  totalCostUsd: number;
  startedAt: string;
  endedAt: string | null;
}

export interface WebCreatorSpecDTO {
  companyName: string;
  industry: string;
  accentHex: string;
  logoUrl: string | null;
  logoPrompt: string | null;
}

export interface IntegrationStatusDTO {
  provider: IntegrationProvider;
  connected: boolean;
  meta: Record<string, unknown>;
}

export interface RepoDTO {
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  private: boolean;
  description: string | null;
  updatedAt: string | null;
}

// ─── Request payloads ───────────────────────────────────────────────────────

export const CreateProjectInput = z.object({
  repoOwner: z.string().min(1),
  repoName: z.string().min(1),
  defaultBranch: z.string().min(1).default("main"),
  name: z.string().min(1).optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectInput>;

export const RenameProjectInput = z.object({
  name: z.string().min(1).max(120),
});
export type RenameProjectInput = z.infer<typeof RenameProjectInput>;

export const UpdateGoalInput = z.object({
  mainGoal: z.string().default(""),
  limitations: z.string().default(""),
  reasoning: z.string().default(""),
});
export type UpdateGoalInput = z.infer<typeof UpdateGoalInput>;

export const AddInstructionInput = z.object({
  text: z.string().min(1),
});
export type AddInstructionInput = z.infer<typeof AddInstructionInput>;

export const EditInstructionInput = z.object({
  text: z.string().min(1),
});
export type EditInstructionInput = z.infer<typeof EditInstructionInput>;

export const ReorderInstructionsInput = z.object({
  orderedIds: z.array(z.string()).min(1),
});
export type ReorderInstructionsInput = z.infer<typeof ReorderInstructionsInput>;

export const SaveRailwayInput = z.object({
  token: z.string().min(1),
  projectId: z.string().optional(),
  serviceId: z.string().optional(),
  environmentId: z.string().optional(),
});
export type SaveRailwayInput = z.infer<typeof SaveRailwayInput>;

export const SaveGeminiInput = z.object({
  apiKey: z.string().min(1),
});
export type SaveGeminiInput = z.infer<typeof SaveGeminiInput>;

export const GenerateLogoInput = z.object({
  prompt: z.string().min(1),
  companyName: z.string().optional(),
  accentHex: z.string().optional(),
});
export type GenerateLogoInput = z.infer<typeof GenerateLogoInput>;

export const WebCreatorInput = z.object({
  companyName: z.string().min(1),
  industry: z.string().min(1),
  accentHex: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Must be a #RRGGBB hex color"),
  logoUrl: z.string().nullable().optional(),
  logoPrompt: z.string().nullable().optional(),
  extraNotes: z.string().optional(),
});
export type WebCreatorInput = z.infer<typeof WebCreatorInput>;

export const LoginInput = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInput>;
