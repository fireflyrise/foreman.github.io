# Foreman — Setup Instructions

The single, complete setup guide: **local development** and the full **production deploy to
Railway** with the custom domain `foreman.fireflyrise.com` (Namecheap), plus connecting
integrations and error monitoring. It's written click-by-click — you shouldn't need to guess
anything.

## What you're deploying

Foreman is **one Docker service + one Postgres database**:

```
┌─────────────────────────────────────────┐        ┌──────────────┐
│  Foreman service (docker/Dockerfile)     │        │  PostgreSQL  │
│  • Fastify API + Claude Agent SDK        │ <────> │  (Railway    │
│  • serves the React SPA from /public     │        │   plugin)    │
│  • runs `prisma migrate deploy` on boot  │        └──────────────┘
└─────────────────────────────────────────┘
```

The Dockerfile builds all three workspace packages (`packages/shared`, `apps/server`,
`apps/web`), copies the built web UI into the server, runs DB migrations, and starts a single
Node process. **You do not deploy `apps/web` and `apps/server` separately** — see the
monorepo warning in Part B, Step 1.

> ⚠️ **Security.** Foreman runs Claude Code in full-bypass mode and stores your GitHub,
> Anthropic, and Railway credentials (encrypted). It is single-user and login-gated. Never
> share the URL or your password, and use a strong password.

## Contents
- [Accounts & tools you need](#accounts--tools-you-need)
- [Generate your secrets (do this first)](#generate-your-secrets-do-this-first)
- [Part A — Local development](#part-a--local-development)
- [Part B — Deploy to Railway (production)](#part-b--deploy-to-railway-production)
- [Part C — Connect Railway log access (for projects Foreman builds)](#part-c--connect-railway-log-access-for-projects-foreman-builds)
- [Part D — Error monitoring & alerts](#part-d--error-monitoring--alerts)
- [Environment variable reference](#environment-variable-reference)
- [Troubleshooting](#troubleshooting)

---

## Accounts & tools you need

| Thing | Why | Required? |
|---|---|---|
| **GitHub account** + this repo (`fireflyrise/foreman.github.io`) | source + OAuth login + repos to work on | yes |
| **Railway account** (railway.com) | hosting | yes (for deploy) |
| **Anthropic API key** (console.anthropic.com) | Web Creator + Module 1 API fallback | yes |
| **Namecheap** domain `fireflyrise.com` | custom domain | yes (for the custom URL) |
| **Node 22 + pnpm** locally | generate the password hash / run locally | needed at least once (for the hash) |
| **Claude Pro/Max** + `claude setup-token` | lets Module 1 bill your subscription instead of the API | optional |
| **Gemini API key** (aistudio.google.com) | logo generation in Web Creator | optional |
| **Slack incoming webhook** | HIGH/CRITICAL error alerts | optional |

Install pnpm if you don't have it: `npm i -g pnpm` (or `corepack enable`).

---

## Generate your secrets (do this first)

You need three secret values. Generate them now and keep them somewhere safe — you'll paste
them into Railway (Part B, Step 5) or your local `.env` (Part A).

> **Windows note:** `openssl` is **not** available in `cmd`/PowerShell by default — you'll see
> *"'openssl' is not recognized…"*. Use the **Node** or **PowerShell** command shown for each
> value instead (Node is easiest since you need it for the project anyway). `openssl` *does*
> work in **Git Bash** (installed with Git for Windows) if you prefer it.

**1. `MASTER_ENCRYPTION_KEY`** — 32-byte key that encrypts stored tokens at rest:
```bash
# macOS/Linux/Git Bash:
openssl rand -base64 32
# Node (any OS):
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# PowerShell (Windows):
#   $b=[byte[]]::new(32);[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b);[Convert]::ToBase64String($b)
# e.g. hyVMjeDo01yxhp2LTaXTzWaL+8+dXFTLwvBKccEKUYY=
```

**2. `SESSION_SECRET`** — signs your login cookie (any 32+ random chars):
```bash
# macOS/Linux/Git Bash:
openssl rand -base64 48 | tr -d '/+=' | cut -c1-48
# Node (any OS):
node -e "console.log(require('crypto').randomBytes(48).toString('base64').replace(/[/+=]/g,'').slice(0,48))"
```

**3. `AUTH_PASSWORD_HASH`** — the bcrypt hash of the password you'll log in with. From a clone
of the repo:
```bash
pnpm install
# macOS/Linux/Git Bash (single quotes):
pnpm --filter @foreman/server hash-password 'YOUR_LOGIN_PASSWORD'
# Windows cmd/PowerShell (use DOUBLE quotes):
pnpm --filter @foreman/server hash-password "YOUR_LOGIN_PASSWORD"
# prints something like: $2a$12$abcd...   <- copy the whole line
```
You never store the plaintext password anywhere — only this hash. `AUTH_USERNAME` defaults to
`admin`; you log in with `admin` + your password.

> Lost the hash later or changing the password? Just re-run the command and update the
> `AUTH_PASSWORD_HASH` variable.

---

## Part A — Local development

Run Foreman on your own machine. Requires Node 22 and a Postgres database.

**1. Install dependencies**
```bash
pnpm install
```

**2. Start a Postgres** (skip if you already have one). Quick local Postgres via Docker:
```bash
docker run --name foreman-pg -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=foreman -p 5432:5432 -d postgres:16
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/foreman?schema=public
```

**3. Create `apps/server/.env`** from the example and fill it in:
```bash
cp .env.example apps/server/.env
```
Minimum values for local dev (see the [variable reference](#environment-variable-reference)
for all of them):
```
NODE_ENV=development
PORT=3001
APP_URL=http://localhost:3001
WEB_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/foreman?schema=public
AUTH_USERNAME=admin
AUTH_PASSWORD_HASH=<your hash from "Generate your secrets">
SESSION_SECRET=<your session secret>
MASTER_ENCRYPTION_KEY=<your master key>
ANTHROPIC_API_KEY=<your anthropic key>
GITHUB_CLIENT_ID=<from a GitHub OAuth app, see below>
GITHUB_CLIENT_SECRET=<from a GitHub OAuth app, see below>
```

**4. Create a GitHub OAuth App for local use** (GitHub → Settings → Developer settings →
OAuth Apps → New OAuth App):
- Homepage URL: `http://localhost:3001`
- Authorization callback URL: `http://localhost:3001/api/github/callback`
- Copy Client ID + generate a Client Secret into your `.env`.

**5. Run migrations and start**
```bash
pnpm db:migrate     # creates the tables
pnpm dev            # server on :3001, web on :5173 (the web dev server proxies /api)
```
Open **http://localhost:5173**, log in (`admin` + your password), then **Integrations →
Connect GitHub** and **Add Project**.

**Validate the codebase anytime:** `pnpm build`, `pnpm typecheck`, `pnpm test`.

---

## Part B — Deploy to Railway (production)

~15–20 minutes. Do the steps in order.

### Step 1 — Create the project as a SINGLE Dockerfile service

1. Go to **railway.com → New Project → Deploy from GitHub repo → `foreman.github.io`**.
   (If Railway asks to install its GitHub app / grant access to the repo, do that first.)

2. **⚠️ Avoid the monorepo split.** Railway scans the repo, sees the pnpm workspace, and may
   stage **two** services named `server` and `web` (Nixpacks). **That is wrong** — Foreman is
   one Docker container. If you see two service cards:
   - Discard them: hover each card → **⋮ → Remove**, or use the **undo** arrow (bottom-left of
     the canvas) until the canvas is empty / no staged changes.
   - Then add a single service: **＋ New → GitHub Repo → `foreman.github.io`**.

   You want exactly **one** service card (named after the repo) before continuing.

3. Open that service → **Settings**, and set:
   - **Source → Root Directory:** leave **empty** (repo root — the Docker build context must be
     the whole repo).
   - **Source → Branch:** `main`.
   - **Build → Builder:** **Dockerfile** (not Nixpacks).
   - **Build → Dockerfile Path:** type **`docker/Dockerfile`** (or `/docker/Dockerfile`). The
     field defaults to a root `Dockerfile`, which does **not** exist here — if you leave the
     default, the build fails. (The repo's `railway.json` also declares this, but set the field
     explicitly.)
   - **Build → Watch Paths:** leave **empty** (redeploy on any push to `main`).
   - **Deploy → Custom Start Command:** leave **empty** — the Dockerfile already runs
     `prisma migrate deploy` then `node dist/index.js`. Do **not** add a start command.

4. *(Optional)* Rename the service to something clear like `foreman` (Settings, top — or
   right-click the card → Rename). Cosmetic only. **Do not rename the Postgres plugin** you add
   next — variables reference it by name.

> The first deploy will fail or crash-loop until the database and variables exist (Steps 2 &
> 5). That's expected — don't worry about red deploys yet.

### Step 2 — Add the Postgres database

On the project canvas: **＋ New → Database → Add PostgreSQL**. Railway provisions it and
exposes its connection string. Keep its name as **`Postgres`** (the default) so the reference
in Step 5 works. Migrations run automatically on every boot.

### Step 3 — Custom domain (`foreman.fireflyrise.com` via Namecheap)

Your public URL — and therefore `APP_URL` — is **`https://foreman.fireflyrise.com`**.

**a. In Railway:** Foreman service → **Settings → Networking → Custom Domain** → enter
`foreman.fireflyrise.com` → **Add Domain**. Railway shows a **CNAME target** like
`abcd1234.up.railway.app`. **Copy that exact value.**

**b. In Namecheap:** Domain List → **Manage** next to `fireflyrise.com` → **Advanced DNS** tab
→ **Add New Record**:

| Type | Host | Value | TTL |
|---|---|---|---|
| `CNAME Record` | `foreman` | the Railway CNAME target (e.g. `abcd1234.up.railway.app`) | Automatic |

- **Host is just `foreman`** — Namecheap appends `.fireflyrise.com`. Do not enter the full
  domain.
- Delete any existing record for the `foreman` host that conflicts (old A record, CNAME, or
  URL Redirect). **Do not** use Namecheap's "URL Redirect" — it must be a real CNAME.
- Click the green ✓ to save.

**c. Wait for it to go live.** DNS usually propagates in a few minutes (up to a few hours).
Railway issues the TLS certificate automatically once it sees the CNAME — wait until the
domain shows **Active** with a certificate in Railway. Check propagation with:
```bash
dig foreman.fireflyrise.com CNAME +short    # should print the Railway target
```

> Want to test before DNS is ready? Railway → Networking → **Generate Domain** gives a
> temporary `*.up.railway.app` URL. If you use it, set `APP_URL`/`WEB_ORIGIN` and the GitHub
> OAuth callback to that URL instead — they must always match whatever URL you actually open.

### Step 4 — Create the GitHub OAuth App (production)

GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**:
- **Application name:** anything (e.g. "Foreman").
- **Homepage URL:** `https://foreman.fireflyrise.com`
- **Authorization callback URL:** `https://foreman.fireflyrise.com/api/github/callback`
  — must match **exactly** (scheme, host, path, no trailing slash).
- Click **Register application**, then **Generate a new client secret**.
- Copy the **Client ID** and the **Client Secret** for Step 5.

### Step 5 — Set the service variables

Foreman service → **Variables** tab → **Raw Editor** → paste the block below, replacing every
`<...>`. (See the [full reference](#environment-variable-reference) for what each does.)

```
NODE_ENV=production
APP_URL=https://foreman.fireflyrise.com
WEB_ORIGIN=https://foreman.fireflyrise.com
DATABASE_URL=${{Postgres.DATABASE_URL}}

AUTH_USERNAME=admin
AUTH_PASSWORD_HASH=<your bcrypt hash>
SESSION_SECRET=<your session secret>
MASTER_ENCRYPTION_KEY=<your master key>

ANTHROPIC_API_KEY=<your anthropic api key>

GITHUB_CLIENT_ID=<client id from Step 4>
GITHUB_CLIENT_SECRET=<client secret from Step 4>

PLATFORM=railway
```
Optional extras (add any you want):
```
CLAUDE_CODE_OAUTH_TOKEN=<from `claude setup-token`, for Module 1 on your Max plan>
GEMINI_API_KEY=<for logo generation>
ALERT_WEBHOOK_URL=<Slack incoming webhook for HIGH/CRITICAL error digests>
WORKSPACES_DIR=/data/workspaces   # only if you add the volume in Step 6
```

Key notes:
- `DATABASE_URL=${{Postgres.DATABASE_URL}}` is a **reference variable** — it auto-fills from the
  Postgres plugin. The name in the `${{...}}` must match your Postgres service's name exactly
  (default `Postgres`). You can also use Railway's **＋ Add Reference** button instead of typing
  it.
- **Do NOT set `PORT`.** Railway injects it; the server reads it automatically. Setting it
  yourself can break the health check.
- `WEB_ORIGIN` must equal your public URL (the SPA is served from the same origin in prod).

### Step 6 — (Optional but recommended) Add a volume for cloned repos

The agent clones each connected project into `WORKSPACES_DIR`. Without a volume those clones
live on ephemeral disk and are re-cloned after each redeploy (works, just slower). To persist:
- Foreman service → **Settings → Volumes → New Volume**, mount path **`/data`**.
- Set variable `WORKSPACES_DIR=/data/workspaces`.

### Step 7 — Deploy & verify

1. Click **Deploy** (or it auto-deploys when you changed variables). Watch **Deployments →**
   the latest build logs.
2. When it's green and the domain is **Active**:
   - **Health check:** open `https://foreman.fireflyrise.com/api/health` → should return
     `{"ok":true}`.
   - **App:** open `https://foreman.fireflyrise.com` → log in with `admin` + your password.

### Step 8 — First run inside Foreman

1. **Integrations → Connect GitHub** → authorize (this is the OAuth round-trip; it must land
   back on your domain).
2. **Add Project** → pick a repo to work on.
3. Set a **goal** + instructions (Module 1) or fill the **Web Creator** form (Module 2), then
   **Run**.
4. *(Optional)* Wire Railway log access for the projects you build — see Part C.

---

## Part C — Connect Railway log access (for projects Foreman builds)

This is **separate** from hosting Foreman. It lets the agent pull a built project's Railway
deploy logs and self-heal failed deploys.

**1. Create a Railway API token:** Railway → **Account Settings → Tokens → Create Token** →
copy it. In Foreman: **Integrations → Railway** → paste the token (and, optionally,
account-wide default project/service/environment IDs).

**2. Per-project target:** on each Foreman project, click the **🚆 Railway** button and enter
that project's Railway **project / service / environment IDs**. Per-project values override the
account defaults, so each project pulls logs from its own service.

**Where to find the IDs:** open the target service in the Railway dashboard — the URL looks
like `railway.com/project/<PROJECT_ID>/service/<SERVICE_ID>?environmentId=<ENV_ID>`. Copy those
three values.

Once set: the agent can call the `fetch_railway_logs` tool mid-build, and the **↻ Railway**
button in the Agent Console pulls the latest deploy and auto-injects a "diagnose and fix"
instruction when a deploy failed.

---

## Part D — Error monitoring & alerts

Foreman records its **own** failures to a durable `ErrorLog` table (not just ephemeral
stdout). Two optional layers on top:

- **Alerts:** set `ALERT_WEBHOOK_URL` to a Slack incoming webhook to receive a digest of
  HIGH/CRITICAL errors. Without it, errors are still recorded — just not pushed.
- **Triage:** run the daily routine in [`docs/error-triage-routine.md`](docs/error-triage-routine.md)
  from an environment that can reach the production `DATABASE_URL`. It groups recurring errors,
  fixes the confident ones (branch → PR → CI → merge), and flags the rest. This needs no
  Railway token — it's app-owned.

---

## Environment variable reference

Defined in `apps/server/src/env.ts`; template in `.env.example`.

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | rec. | `development` | `production` on Railway. |
| `PORT` | no | `3001` | **Don't set on Railway** — it injects this. |
| `APP_URL` | yes | `http://localhost:3001` | Public URL; used for OAuth callbacks. |
| `WEB_ORIGIN` | yes | `http://localhost:5173` | Allowed browser origin (your public URL in prod). |
| `DATABASE_URL` | yes | — | Postgres connection string. On Railway: `${{Postgres.DATABASE_URL}}`. |
| `AUTH_USERNAME` | yes | `admin` | Login username. |
| `AUTH_PASSWORD_HASH` | yes | — | bcrypt hash of your login password. |
| `SESSION_SECRET` | yes | — | Signs the session cookie (32+ random chars). |
| `MASTER_ENCRYPTION_KEY` | yes | — | 32-byte base64/hex key; encrypts stored tokens. |
| `ANTHROPIC_API_KEY` | yes | — | Web Creator + Module 1 API fallback. |
| `CLAUDE_CODE_OAUTH_TOKEN` | no | — | Subscription token (`claude setup-token`) for Module 1. |
| `AGENT_MODEL` | no | `claude-opus-4-8` | Model the orchestrated Claude Code uses. |
| `MAX_CONCURRENT_SESSIONS` | no | `3` | Cap on simultaneous agent sessions. |
| `SESSION_COST_LIMIT_USD` | no | `10` | Per-session cost ceiling (kill switch). |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | yes | — | From your GitHub OAuth App. |
| `GIT_AUTHOR_NAME` / `GIT_AUTHOR_EMAIL` | no | Foreman Bot | Commit identity for the agent. |
| `GEMINI_API_KEY` | no | — | Logo generation (Web Creator). |
| `GEMINI_IMAGE_MODEL` | no | `gemini-2.5-flash-image` | Image model id. |
| `WORKSPACES_DIR` | no | `./workspaces` | Where cloned project repos live (point at a volume to persist). |
| `PLATFORM` | no | `railway` | Label stamped on error rows. |
| `ALERT_WEBHOOK_URL` | no | — | Slack/JSON webhook for HIGH/CRITICAL digests. |
| `ALERT_POLL_INTERVAL_MS` | no | `300000` | How often the notifier scans for unsent alerts. |

---

## Troubleshooting

- **Two services got created (`server` + `web`):** that's Railway's monorepo auto-split —
  wrong. Remove them and create one Dockerfile service (Part B, Step 1).
- **Build fails immediately / "Dockerfile not found":** the **Dockerfile Path** must be
  `docker/Dockerfile`, and **Root Directory** must be empty. Confirm the Builder is
  **Dockerfile**, not Nixpacks.
- **Build succeeds, then the container crash-loops:** almost always a missing/invalid required
  variable. Check `DATABASE_URL`, `MASTER_ENCRYPTION_KEY`, `SESSION_SECRET`,
  `AUTH_PASSWORD_HASH`. The boot error is also written to the `ErrorLog` table as
  `SERVER_BOOT_FAILURE`. Check Railway **Deployments → Logs**.
- **Health check failing:** make sure you did **not** set `PORT`, and the path
  `/api/health` returns `{"ok":true}`.
- **Can't log in:** `AUTH_PASSWORD_HASH` must be the bcrypt hash (not the plaintext password),
  and you log in with `AUTH_USERNAME` (default `admin`).
- **GitHub connect fails / redirect mismatch:** the OAuth callback must be **exactly**
  `https://foreman.fireflyrise.com/api/github/callback`, and `APP_URL` must equal that domain.
- **Domain not working / no certificate:** confirm the Namecheap **CNAME** for host `foreman`
  points at the exact Railway target, there's no conflicting A/URL-Redirect record, and DNS has
  propagated (`dig foreman.fireflyrise.com CNAME +short`). Railway issues TLS only after it
  resolves.
- **`DATABASE_URL` reference shows empty:** the `${{Postgres.DATABASE_URL}}` name must match
  your Postgres service's exact name. Rename it back to `Postgres` or update the reference.
- **Run migrations manually:** `pnpm --filter @foreman/server db:deploy` with `DATABASE_URL`
  set.
