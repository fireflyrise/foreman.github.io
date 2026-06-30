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
/** Which credential an orchestrated session bills against. */
export const AuthMode = z.enum(["subscription", "api"]);
export type AuthMode = z.infer<typeof AuthMode>;

export const ProjectType = z.enum(["software", "web"]);
export type ProjectType = z.infer<typeof ProjectType>;

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
  "limit_paused", // subscription limit hit; awaiting user choice
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
  projectType: ProjectType;
  mergePolicy: MergePolicy;
  authMode: AuthMode;
  webAuthMode: AuthMode;
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

export interface InstructionAttachmentDTO {
  id: string;
  filename: string;
  mimeType: string;
}

export interface InstructionDTO {
  id: string;
  order: number;
  text: string;
  status: InstructionStatus;
  costUsd: number | null;
  attachments: InstructionAttachmentDTO[];
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

// The full Web Creator spec returned to the UI mirrors the intake input.
export type WebCreatorSpecDTO = WebCreatorInput;

export interface IntegrationStatusDTO {
  provider: IntegrationProvider;
  connected: boolean;
  meta: Record<string, unknown>;
}

export interface IntegrationTestDTO {
  provider: IntegrationProvider;
  /** Whether a credential is present at all. */
  connected: boolean;
  /** Whether the live API call actually succeeded. */
  ok: boolean;
  /** Human-readable detail (login, "key valid", or the error message). */
  detail: string;
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
  projectType: ProjectType.default("software"),
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

/** Attach a file/photo to an instruction (base64, no data: prefix). ~20MB cap. */
export const AddAttachmentInput = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(150),
  dataBase64: z.string().min(1).max(28_000_000),
});
export type AddAttachmentInput = z.infer<typeof AddAttachmentInput>;

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

/** Default conversion goal for a Web Creator site (rewritable per project). */
export const DEFAULT_WEB_GOAL =
  "Convert visitors into leads: get the client to call us, send us a message, or book an appointment. Every page, headline, and CTA funnels toward that single action.";

const hex = z.string().regex(/^#([0-9a-fA-F]{6})$/, "Must be a #RRGGBB hex color");

export const ReviewInput = z.object({
  name: z.string().default(""),
  city: z.string().default(""),
  text: z.string().default(""),
});
export type ReviewInput = z.infer<typeof ReviewInput>;

export const FaqInput = z.object({
  question: z.string().default(""),
  answer: z.string().default(""),
});
export type FaqInput = z.infer<typeof FaqInput>;

/**
 * Full Web Creator intake — mirrors the WebCreator skill's guided interview
 * (Rounds 1–6) so the orchestrator has everything it needs to build the site
 * without re-interviewing the client.
 */
export const WebCreatorInput = z.object({
  // Conversion goal (Module 2 equivalent of the Module 1 goal).
  goal: z.string().default(DEFAULT_WEB_GOAL),

  // ── Round 1: Business identity ──
  companyName: z.string().min(1),
  industry: z.string().min(1),
  businessType: z.enum(["local", "national"]).default("local"),
  city: z.string().default(""),
  state: z.string().default(""),
  businessAddress: z.string().default(""),
  phone: z.string().default(""),
  email: z.string().default(""),
  googleMapsEmbed: z.string().default(""),
  domain: z.string().default(""),

  // ── Round 2: Services ──
  mainService: z.string().default(""),
  services: z.array(z.string()).default([]),
  locationInFilenames: z.boolean().default(true),

  // ── Round 3: Branding ──
  accentHex: hex, // COLOR_PRIMARY
  colorHover: hex.optional(),
  logoUrl: z.string().nullable().optional(),
  logoPrompt: z.string().nullable().optional(),
  faviconLightUrl: z.string().nullable().optional(),
  faviconDarkUrl: z.string().nullable().optional(),
  tagline: z.string().default(""),
  fontHeading: z.string().default("Montserrat"),
  fontBody: z.string().default("Open Sans"),

  // ── Round 4: Features ──
  bookingEnabled: z.boolean().default(false),
  bookingEmbed: z.string().default(""),
  bilingual: z.boolean().default(false),
  spanishRegion: z.string().default(""),
  modalWebhookUrl: z.string().default(""),

  // ── Round 5: Social proof & extras ──
  reviewsSource: z.enum(["client", "generated"]).default("generated"),
  reviews: z.array(ReviewInput).default([]),
  heroImageUrl: z.string().nullable().optional(),
  faqs: z.array(FaqInput).default([]),
  ogImageSource: z.enum(["client", "generated"]).default("generated"),
  ogImageUrl: z.string().nullable().optional(),

  // ── Round 6: Audience & market research ──
  idealCustomer: z.string().default(""),
  painPoints: z.string().default(""),
  fearsObjections: z.string().default(""),
  dreamOutcome: z.string().default(""),
  proof: z.string().default(""),
  edge: z.string().default(""),
  offer: z.string().default(""),
  urgency: z.string().default(""),

  extraNotes: z.string().default(""),
});
export type WebCreatorInput = z.infer<typeof WebCreatorInput>;

/** Lenient variant for autosaving a half-filled form (no required fields). */
export const WebCreatorDraftInput = WebCreatorInput.extend({
  companyName: z.string(),
  industry: z.string(),
});
export type WebCreatorDraftInput = z.infer<typeof WebCreatorDraftInput>;

export const LoginInput = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInput>;

export const ResolveLimitInput = z.object({
  choice: z.enum(["api", "wait"]),
});
export type ResolveLimitInput = z.infer<typeof ResolveLimitInput>;

export const SetAuthModeInput = z.object({
  authMode: AuthMode,
});
export type SetAuthModeInput = z.infer<typeof SetAuthModeInput>;

/** Set the Web Creator (Module 2) auth mode. */
export const SetWebAuthModeInput = z.object({
  webAuthMode: AuthMode,
});
export type SetWebAuthModeInput = z.infer<typeof SetWebAuthModeInput>;

/** Set when the session branch merges to main. */
export const SetMergePolicyInput = z.object({
  mergePolicy: MergePolicy,
});
export type SetMergePolicyInput = z.infer<typeof SetMergePolicyInput>;

/** Per-project Railway target (overrides the account-wide defaults). */
export const SetProjectRailwayInput = z.object({
  railwayProjectId: z.string().nullable().optional(),
  railwayServiceId: z.string().nullable().optional(),
  railwayEnvironmentId: z.string().nullable().optional(),
});
export type SetProjectRailwayInput = z.infer<typeof SetProjectRailwayInput>;
