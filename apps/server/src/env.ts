import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

function int(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
}

function num(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number.parseFloat(v);
  return Number.isNaN(n) ? fallback : n;
}

export const env = {
  nodeEnv: optional("NODE_ENV", "development"),
  isProd: optional("NODE_ENV", "development") === "production",
  port: int("PORT", 3001),
  appUrl: optional("APP_URL", "http://localhost:3001"),
  webOrigins: optional("WEB_ORIGIN", "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  authUsername: optional("AUTH_USERNAME", "admin"),
  authPasswordHash: optional("AUTH_PASSWORD_HASH"),
  sessionSecret: optional("SESSION_SECRET", "dev-insecure-session-secret-change-me"),

  masterEncryptionKey: optional("MASTER_ENCRYPTION_KEY"),

  databaseUrl: optional("DATABASE_URL"),

  anthropicApiKey: optional("ANTHROPIC_API_KEY"),
  // Long-lived OAuth token from `claude setup-token` (Max/Pro). Used for
  // Module 1 (Software Creator) so work bills against the subscription.
  claudeCodeOauthToken: optional("CLAUDE_CODE_OAUTH_TOKEN"),
  // Empty = let the Claude Code CLI pick its default model (passing an unknown
  // model id exits the process). Override with a valid alias/id via AGENT_MODEL.
  agentModel: optional("AGENT_MODEL", ""),
  maxConcurrentSessions: int("MAX_CONCURRENT_SESSIONS", 3),
  sessionCostLimitUsd: num("SESSION_COST_LIMIT_USD", 10),

  githubClientId: optional("GITHUB_CLIENT_ID"),
  githubClientSecret: optional("GITHUB_CLIENT_SECRET"),
  gitAuthorName: optional("GIT_AUTHOR_NAME", "Foreman Bot"),
  gitAuthorEmail: optional("GIT_AUTHOR_EMAIL", "foreman-bot@users.noreply.github.com"),

  geminiApiKey: optional("GEMINI_API_KEY"),
  geminiImageModel: optional("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image"),

  workspacesDir: optional("WORKSPACES_DIR", "./workspaces"),

  // ── Error capture / alerting ──
  /** Hosting platform label stamped on error rows (informational). */
  platform: optional("PLATFORM", "railway"),
  /** Webhook the alert digest POSTs to (Slack incoming-webhook or generic JSON). */
  alertWebhookUrl: optional("ALERT_WEBHOOK_URL"),
  /** How often the notifier scans for unsent HIGH/CRITICAL errors (ms). */
  alertPollIntervalMs: int("ALERT_POLL_INTERVAL_MS", 300000),

  /** Where to send the browser after an OAuth round-trip (the SPA). */
  webRedirect(): string {
    // In production the SPA is served from the same origin; in dev use the
    // first configured web origin (the Vite dev server).
    if (this.isProd) return this.appUrl;
    return this.webOrigins[0] ?? this.appUrl;
  },
};
