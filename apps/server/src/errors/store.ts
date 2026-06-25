import { prisma } from "../db.js";
import { env } from "../env.js";
import {
  DEFAULT_SEVERITY,
  type ErrorTypeCode,
  type Severity,
} from "./types.js";

export interface RecordErrorInput {
  errorType: ErrorTypeCode;
  error: unknown;
  /** Foreman projectId, or a component label ("system", "github-oauth", …). */
  project?: string;
  /** Ids/params needed to reproduce. */
  context?: Record<string, unknown>;
  /** Override the type's default severity. */
  severity?: Severity;
  platform?: string;
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.stack ?? error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Write one durable error row. NEVER throws — error recording must not become a
 * second failure. The table is the source of truth; stdout is a fallback only.
 */
export async function recordError(input: RecordErrorInput): Promise<void> {
  const severity = input.severity ?? DEFAULT_SEVERITY[input.errorType];
  const message = messageOf(input.error);
  try {
    await prisma.errorLog.create({
      data: {
        project: input.project ?? "system",
        errorType: input.errorType,
        errorMessage: message,
        errorContext: (input.context ?? {}) as object,
        severity,
        platform: input.platform ?? env.platform ?? null,
      },
    });
  } catch (writeErr) {
    // Last-resort fallback so the failure is at least visible somewhere.
    console.error(
      `[recordError] failed to persist ${input.errorType} (${severity}): ${message}`,
      writeErr,
    );
  }
}

/** Fire-and-forget convenience for use inside sync catch blocks. */
export function recordErrorAsync(input: RecordErrorInput): void {
  void recordError(input);
}
