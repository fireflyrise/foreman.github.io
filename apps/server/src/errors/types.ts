/**
 * Stable, grep-able error type codes. The triage routine greps the codebase for
 * these constants, so each value is a unique string used in exactly one place
 * (or a small, intentional set). Keep the constant name === its string value.
 *
 * Severity reflects blast radius:
 *   CRITICAL = revenue / data loss / app down
 *   HIGH     = a feature is broken for the user
 *   MEDIUM   = degraded / recoverable
 *   LOW      = noise / optional feature
 */
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const ErrorType = {
  // Process / boot
  SERVER_BOOT_FAILURE: "SERVER_BOOT_FAILURE",
  UNCAUGHT_EXCEPTION: "UNCAUGHT_EXCEPTION",
  UNHANDLED_REJECTION: "UNHANDLED_REJECTION",

  // Agent engine
  AGENT_SESSION_ERROR: "AGENT_SESSION_ERROR",
  AGENT_GIT_PR_FAILURE: "AGENT_GIT_PR_FAILURE",
  AGENT_GIT_MERGE_FAILURE: "AGENT_GIT_MERGE_FAILURE",
  AGENT_RAILWAY_FETCH_FAILURE: "AGENT_RAILWAY_FETCH_FAILURE",

  // Integrations / routes
  GITHUB_OAUTH_CALLBACK_FAILURE: "GITHUB_OAUTH_CALLBACK_FAILURE",
  GITHUB_REPO_LIST_FAILURE: "GITHUB_REPO_LIST_FAILURE",
  GEMINI_LOGO_FAILURE: "GEMINI_LOGO_FAILURE",
  SESSION_START_FAILURE: "SESSION_START_FAILURE",
  WEBCREATOR_RUN_FAILURE: "WEBCREATOR_RUN_FAILURE",
  RAILWAY_REFRESH_FAILURE: "RAILWAY_REFRESH_FAILURE",

  // Subsystems
  NOTIFIER_FAILURE: "NOTIFIER_FAILURE",
} as const;

export type ErrorTypeCode = (typeof ErrorType)[keyof typeof ErrorType];

/** Default severity per type (callers may override). */
export const DEFAULT_SEVERITY: Record<ErrorTypeCode, Severity> = {
  SERVER_BOOT_FAILURE: "CRITICAL",
  UNCAUGHT_EXCEPTION: "CRITICAL",
  UNHANDLED_REJECTION: "CRITICAL",

  AGENT_SESSION_ERROR: "HIGH",
  AGENT_GIT_PR_FAILURE: "HIGH",
  AGENT_GIT_MERGE_FAILURE: "HIGH",
  AGENT_RAILWAY_FETCH_FAILURE: "MEDIUM",

  GITHUB_OAUTH_CALLBACK_FAILURE: "HIGH",
  GITHUB_REPO_LIST_FAILURE: "MEDIUM",
  GEMINI_LOGO_FAILURE: "LOW",
  SESSION_START_FAILURE: "MEDIUM",
  WEBCREATOR_RUN_FAILURE: "MEDIUM",
  RAILWAY_REFRESH_FAILURE: "LOW",

  NOTIFIER_FAILURE: "MEDIUM",
};
