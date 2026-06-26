# Deploying Foreman to Railway

Step-by-step setup. ~15 minutes. Foreman runs as a single Docker service + a Postgres
database. The repo already includes `docker/Dockerfile` and `railway.json`, so Railway
builds and boots it without extra config.

> ⚠️ Foreman runs Claude Code in **full-bypass** mode and stores GitHub/Anthropic/Railway
> credentials. It is single-user and login-gated — never share the URL or the password.

---

## 0. Prerequisites (gather these first)

You'll paste these into Railway as environment variables in step 3.

| Value | How to get it |
|---|---|
| `MASTER_ENCRYPTION_KEY` | `openssl rand -base64 32` |
| `SESSION_SECRET` | `openssl rand -base64 32` (any 32+ random chars) |
| `AUTH_PASSWORD_HASH` | clone the repo, then `pnpm install && pnpm --filter @foreman/server hash-password 'YOUR_LOGIN_PASSWORD'` — copy the printed hash |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API keys (used for Web Creator + Module 1 API fallback) |
| `CLAUDE_CODE_OAUTH_TOKEN` *(optional)* | run `claude setup-token` locally (needs a Pro/Max plan) — lets Module 1 bill your subscription |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth App (step 2) |
| `GEMINI_API_KEY` *(optional)* | aistudio.google.com → API key (logo generation) |

---

## 1. Create the Railway project

1. Push this repo to GitHub (it already is).
2. railway.com → **New Project → Deploy from GitHub repo** → pick `foreman.github.io`.
3. Railway detects `railway.json` and builds `docker/Dockerfile` automatically.
   The first deploy will **fail/restart** until you add the env vars and database below —
   that's expected.

## 2. Create the GitHub OAuth App

You need Foreman's public URL first. In Railway: **Settings → Networking → Generate Domain**
(e.g. `https://foreman-production.up.railway.app`). Call this `APP_URL`.

Then at GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**:
- **Homepage URL:** `APP_URL`
- **Authorization callback URL:** `APP_URL/api/github/callback`  ← must match exactly

Copy the **Client ID** and generate a **Client Secret**.

## 3. Add the Postgres database

In the Railway project: **New → Database → Add PostgreSQL**. Railway exposes its
connection string as a variable you'll reference next. Migrations run automatically on
every boot (`prisma migrate deploy` is in the Dockerfile `CMD`).

## 4. Set the service variables

On the **Foreman service → Variables**, add:

```
NODE_ENV=production
APP_URL=https://YOUR-DOMAIN.up.railway.app
WEB_ORIGIN=https://YOUR-DOMAIN.up.railway.app
DATABASE_URL=${{Postgres.DATABASE_URL}}

AUTH_USERNAME=admin
AUTH_PASSWORD_HASH=<from step 0>
SESSION_SECRET=<from step 0>
MASTER_ENCRYPTION_KEY=<from step 0>

ANTHROPIC_API_KEY=<your key>
# CLAUDE_CODE_OAUTH_TOKEN=<optional, for Module 1 on your Max plan>

GITHUB_CLIENT_ID=<from step 2>
GITHUB_CLIENT_SECRET=<from step 2>

# Optional
GEMINI_API_KEY=<optional>
PLATFORM=railway
ALERT_WEBHOOK_URL=<optional Slack/webhook for HIGH/CRITICAL error digests>
WORKSPACES_DIR=/data/workspaces
```

Notes:
- `${{Postgres.DATABASE_URL}}` is a Railway reference variable — it auto-links to the
  Postgres plugin. (Use the exact plugin name shown in your project, often `Postgres`.)
- **Do NOT set `PORT`** — Railway injects it and the server reads it automatically.
- `WEB_ORIGIN` = your domain in production (the SPA is served same-origin by the server).

## 5. (Recommended) Add a volume for cloned repos

The agent clones each connected project into `WORKSPACES_DIR`. Put it on a persistent
volume so checkouts survive redeploys:

- Foreman service → **Volumes → New Volume**, mount path `/data`.
- Set `WORKSPACES_DIR=/data/workspaces` (as above).

Without a volume it still works — repos are just re-cloned after a redeploy.

## 6. Redeploy & verify

Trigger a redeploy (Railway does this on variable change). Then:

- Healthcheck: `APP_URL/api/health` → `{"ok":true}` (Railway's healthcheck uses this).
- Open `APP_URL` → log in with `AUTH_USERNAME` + your password.
- **Integrations → Connect GitHub** (OAuth round-trip), then **Add Project** → pick a repo.
- Optionally paste your **Railway API token** in Integrations and set per-project Railway
  IDs via the 🚆 dialog (see below) so Foreman can pull each project's deploy logs.

---

## Connecting Railway log access (for the projects Foreman builds)

This is separate from hosting Foreman itself. So Foreman can pull a built project's
Railway logs and self-heal failed deploys:

1. **Account token:** Railway → **Account Settings → Tokens → Create Token**. Paste it in
   Foreman's **Integrations → Railway**. (Optionally set account-wide default
   project/service/environment IDs there.)
2. **Per-project target:** on each project, click **🚆 Railway** and set that project's
   Railway **project / service / environment IDs**. Find them in the Railway dashboard URL
   or via the Railway API. Per-project values override the account defaults.

With this set, the agent can call `fetch_railway_logs` mid-build, and **↻ Railway** in the
Agent Console pulls the latest deploy and auto-injects a fix instruction on failure.

## Foreman's own error monitoring

Foreman records its **own** failures to a durable `ErrorLog` table (not platform stdout).
Set `ALERT_WEBHOOK_URL` to a Slack incoming-webhook to get HIGH/CRITICAL digests, and run
the daily triage routine in `docs/error-triage-routine.md`. This needs no Railway token —
it's app-owned.

## Troubleshooting

- **Build fails:** confirm Railway is using `docker/Dockerfile` (it reads `railway.json`).
- **Boots then crashes:** usually a missing required var — check
  `MASTER_ENCRYPTION_KEY`, `SESSION_SECRET`, `DATABASE_URL`. Errors are also written to the
  `ErrorLog` table (`SERVER_BOOT_FAILURE`).
- **GitHub connect fails / redirect mismatch:** the OAuth callback must be exactly
  `APP_URL/api/github/callback` and `APP_URL` must equal your real domain.
- **Migrations:** run automatically on boot; to run manually,
  `pnpm --filter @foreman/server db:deploy` with `DATABASE_URL` set.
