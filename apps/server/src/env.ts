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
  agentModel: optional("AGENT_MODEL", "claude-opus-4-8"),
  maxConcurrentSessions: int("MAX_CONCURRENT_SESSIONS", 3),
  sessionCostLimitUsd: num("SESSION_COST_LIMIT_USD", 10),

  githubClientId: optional("GITHUB_CLIENT_ID"),
  githubClientSecret: optional("GITHUB_CLIENT_SECRET"),
  gitAuthorName: optional("GIT_AUTHOR_NAME", "Foreman Bot"),
  gitAuthorEmail: optional("GIT_AUTHOR_EMAIL", "foreman-bot@users.noreply.github.com"),

  geminiApiKey: optional("GEMINI_API_KEY"),
  geminiImageModel: optional("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image"),

  workspacesDir: optional("WORKSPACES_DIR", "./workspaces"),

  /** Where to send the browser after an OAuth round-trip (the SPA). */
  webRedirect(): string {
    // In production the SPA is served from the same origin; in dev use the
    // first configured web origin (the Vite dev server).
    if (this.isProd) return this.appUrl;
    return this.webOrigins[0] ?? this.appUrl;
  },
};
