# convo.md — Foreman build state & handoff

> Living progress log so work can continue from any new branch. Read this first.
> Last updated: 2026-06-29.

## Standing workflow rules (the user set these)

- **Auto-merge:** for every change, push → open a non-draft PR → wait for CI green →
  merge into `main` automatically (squash), then reset the working branch onto `main`.
  No approval prompt per change. Only pause/ask if CI fails in a way needing a decision
  or the change is genuinely ambiguous/risky.
- **Always update this file (`convo.md`) BEFORE merging into `main`.**
- **Per-project convo.md (orchestrated sessions):** every Foreman session for every module
  (Software Creator, Web Creator, future modules) instructs Claude Code to FIRST read
  `convo.md` at the root of the connected project repo (create it if missing) and keep it
  updated as a running log, committed with its changes. This is enforced in the shared
  autonomy system prompt (`buildAutonomyAppend` in `apps/server/src/agent/prompts.ts`), so
  it automatically applies to any future module that runs through `AgentSession`. NOTE:
  that per-project `convo.md` lives in the user's repo and is distinct from THIS file
  (Foreman's own handoff log).

## What we're building

**Foreman** — a self-hosted web tool that acts as the user when vibe-coding with
Claude Code. It connects to GitHub, lets you pick a repo per project, and
autonomously drives the Claude Agent SDK to build software across multiple
projects (separate, renameable tabs), branching/merging to `main` as it goes,
and pulling Railway error logs to self-heal failed deploys.

**Locked product decisions:** self-hosted web app · build everything at once ·
full-bypass autonomy (`bypassPermissions`, never-ask) · single-user login gate.

Full design lives in `README.md` and the approved plan at
`/root/.claude/plans/i-want-to-create-smooth-pebble.md`.

## Repo / branch / PR

- Repo: `fireflyrise/foreman.github.io` (was empty; this is a from-scratch build).
- Working branch: `claude/sweet-heisenberg-yeek0y` (reset onto `main` after each merge).
- An empty `main` baseline commit was created so the PR diff shows the whole project.
- **PR #1**: MERGED — initial full scaffold.
- **PR #2**: MERGED — Web Creator full skill intake + playbook + Module 2 goal.
- `main` is the source of truth; everything above is merged into it.

## Architecture (TypeScript monorepo: pnpm + Turborepo)

```
packages/shared   # types, zod schemas, SSE AgentEvent contracts
apps/server       # Fastify API + Claude Agent SDK orchestration (SSE)
apps/web          # React + Vite + Tailwind SPA
docker/Dockerfile # builds all 3, copies SPA into server/public, migrate deploy + boot
```

Key files:
- `apps/server/src/agent/AgentSession.ts` — one long-lived streaming-input
  `query()` per project; instructions sent one at a time, gated on each turn's
  `result` message; SSE fan-out; git/PR flow; auth-mode + limit handling.
- `apps/server/src/agent/AsyncInbox.ts` — push-based async iterable feeding the SDK.
- `apps/server/src/agent/SessionRegistry.ts` — concurrent per-project sessions,
  concurrency + cost caps.
- `apps/server/src/agent/prompts.ts` — never-ask autonomy append + goal injection,
  web-creator seed instructions.
- `apps/server/src/git/RepoManager.ts` — clone + session branch (token via remote URL).
- `apps/server/src/integrations/{github,railway,gemini,store}.ts`.
- `apps/server/src/crypto/secrets.ts` — AES-256-GCM at rest.
- `apps/server/prisma/schema.prisma` + migrations `0_init`, `1_add_project_auth_mode`.
- Web: `components/{Workspace,ProjectTabs,ProjectView,GoalEditor,InstructionList,
  AgentConsole,WebCreatorForm,IntegrationsBar,AddProjectDialog,LoginGate}.tsx`,
  `hooks/useAgentStream.ts`, `api/client.ts`.

## Auth / billing model (implemented)

- **Module 1 (Software Creator)** → Max subscription via `CLAUDE_CODE_OAUTH_TOKEN`
  (from `claude setup-token`). Per-project override to API key via the "software
  auth" toggle (`Project.authMode`, default `subscription`).
- **Module 2 (Web Creator)** → always `ANTHROPIC_API_KEY` (client work).
- The two creds are mutually exclusive per session (API key overrides the
  subscription), so `AgentSession.buildAuthEnv()` sets exactly one.
- **No silent fallback.** On a Max usage limit, the session pauses
  (`limit_paused`) and the console shows "continue on API key / wait"
  (`/session/resolve-limit`, user chose **notify & let me choose**).

## Web Creator (Module 2) — full intake + playbook

The WebCreator skill is stored at `apps/server/playbook/webcreator.md` and loaded by
`apps/server/src/agent/webCreatorPlaybook.ts`. It has been **converted from an interview
script into a build-only playbook**: the client interview (Step 1 / Rounds 1–6, "ask the
client" prose, the client-approval steps) was stripped and replaced with declarative
"Inputs — …" sections (data dictionary). All build content — copywriting voice, the
4 CRITICAL rules, fixed 10-section layout, the full Section List, SEO/schema, modal,
image generation, bilingual, output — is preserved verbatim. On a Module 2 run it's
written to `<workspacesDir>/<projectId>.webcreator-playbook.md` (outside the client repo);
the seeded instructions feed it the CLIENT BRIEF (the UI answers) and tell Claude Code to
build from it without ever re-interviewing.

- The form (`apps/web/src/components/WebCreatorForm.tsx`) collects ALL skill interview
  rounds: business identity, services, branding (2 colors, fonts, logo, favicons),
  features (booking, bilingual, modal webhook), social proof (reviews, FAQs, hero/OG),
  and Round 6 audience/market research.
- Full intake schema: `WebCreatorInput` in `packages/shared/src/types.ts` (stored in
  `WebCreatorSpec.details` JSON + hot columns; migration `2_webcreator_goal_details`).
- Module 2 has its own **rewritable goal** (`WebCreatorSpec.goal`), default
  `DEFAULT_WEB_GOAL` (get the client to call/message/book). Passed to the agent as the
  session goal via `SessionRegistry.start({ goalOverride })`.
- Instruction builder: `buildWebCreatorInstructions(spec, playbookPath)` +
  `formatWebBrief(spec)` in `apps/server/src/agent/prompts.ts`.

## Error capture & triage system (app-owned — NOT a log drain / APM)

Platform stdout (Railway) is ephemeral, so failures are persisted to a queryable table.
1. **Durable store** — `ErrorLog` model (`prisma/schema.prisma`, migration `3_error_log`):
   project, errorType (grep-able code), errorMessage, errorContext (JSON), severity
   (LOW/MEDIUM/HIGH/CRITICAL), platform, notifiedAt, resolved+resolvedAt, createdAt;
   indexes on (project,severity,resolved), createdAt, (resolved,severity,notifiedAt).
   - `apps/server/src/errors/types.ts` — `ErrorType` constants + `DEFAULT_SEVERITY`.
   - `apps/server/src/errors/store.ts` — `recordError()` (never throws). Wired into every
     real catch: AgentSession (session/PR/merge), routes (github oauth/repos, gemini logo,
     session start, web-creator run, railway refresh), and `index.ts` (boot failure +
     uncaughtException/unhandledRejection).
2. **Notifier** — `apps/server/src/errors/notifier.ts`: scheduled scan of unsent
   HIGH/CRITICAL (notifiedAt IS NULL) → one digest to `ALERT_WEBHOOK_URL` (Slack/generic)
   → stamps notifiedAt (no re-alert). NOTIFIER_FAILURE is MEDIUM (no self-alert loop).
   Env: `ALERT_WEBHOOK_URL`, `ALERT_POLL_INTERVAL_MS`, `PLATFORM`.
3. **Triage routine** — `docs/error-triage-routine.md`: daily Claude prompt
   (pull/group/rank → grep errorType → categorize real-bug/transient/config/stale → act →
   resolve only when truly fixed) with guardrails (never push to main, never weaken
   logging, no migrations/large refactors, branch→draft PR→green CI→merge). Needs prod
   `DATABASE_URL` (doc flags that cloud/sandboxed sessions usually can't reach it). Helper:
   `pnpm --filter @foreman/server errors:report -- --json --days 7`.

## Status — DONE

- [x] Monorepo scaffold, shared types, Fastify + Vite skeletons, Prisma/Postgres.
- [x] AES-256-GCM secrets, single-user login gate.
- [x] GitHub OAuth + repo listing + backend PR/merge; RepoManager clone/branch.
- [x] Railway GraphQL logs (REST + MCP tool + failure self-heal injection).
- [x] Per-project Railway targeting: token is account-wide; project/service/environment IDs
      resolve per Foreman project (`Project.railway*` via 🚆 dialog + `PUT /projects/:id/railway`,
      account-wide fallback). `resolveTarget()` in `integrations/railway.ts`; `fetchLatestLogs`,
      the `railwayLogsTool` MCP tool, and `/railway/refresh` all pass the Foreman projectId, so
      each session pulls logs for ITS OWN Railway service.
- [x] Gemini "nano banana" logo generation (REST + MCP tool).
- [x] Agent engine + Module 1 (goal editor, drag-reorderable instructions, SSE console).
- [x] Module 2 (web-creator form, logo upload/generate) reusing the engine.
- [x] Per-module auth modes + per-project override + Max-limit notify/choose.
- [x] GitHub Actions CI (typecheck · test · build) — green on PR #1.
- [x] Initial Prisma migrations; Dockerfile for Railway.
- [x] Vitest: AsyncInbox sequencing + secrets round-trip/tamper (6/6 pass).
- [x] Web Creator: full skill intake form + playbook injection + rewritable Module 2 goal.
- [x] Error capture & triage: ErrorLog table + recordError wiring + digest notifier + triage doc.
- [x] Real integration connection tests: live API check per provider (GitHub getAuthenticated,
      Anthropic /v1/models, Railway `me` query, Gemini list-models) via GET /api/integrations/test
      + "Test connections" button; Railway/Gemini saves now verify the credential before storing.
      `integrations/test.ts`, `verifyRailwayToken`, `verifyGeminiKey`. (Status chips still mean
      "present"; the Test button is the real check.) Railway token verify tries `me`, then
      falls back to a `projects` query (workspace/team-scoped tokens can't use `me`); the
      Railway save is non-blocking (warns instead of 400) so a valid workspace token always
      saves. The real functional Railway test is the per-project ↻ button.
- [x] Max-subscription test: "Test Max subscription" button runs a tiny real Claude Code call
      using ONLY CLAUDE_CODE_OAUTH_TOKEN (API key removed from that call's env) so success
      proves Module 1 bills against the Max plan. `integrations/testSubscription.ts` +
      POST /api/integrations/test-subscription.
- [x] Fix "Claude Code process exited with code 1": AGENT_MODEL default is now EMPTY (an
      unknown model id like the internal `claude-opus-4-8` exits the CLI); model is only
      passed when explicitly set. Capture subprocess `stderr` in the subscription test detail
      and stream it to the Agent Console for real Module 1 runs.
- [x] Fix "--dangerously-skip-permissions cannot be used with root/sudo privileges": the
      Railway runtime container runs as root, and Claude Code refuses `bypassPermissions`
      under root unless it believes it's sandboxed. Set `IS_SANDBOX=1` in three places so
      every code path is covered: `ENV IS_SANDBOX=1` in `docker/Dockerfile` (global, runtime
      stage), and explicitly in the `env` object of `AgentSession.buildAuthEnv()` (Module 1
      runs) and `integrations/testSubscription.ts` (the Max-subscription test). After this
      deploys, "Test Max subscription" should go green and Module 1 runs no longer exit 1.

## Verification commands

```bash
export NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt   # only needed in this sandbox
export DATABASE_URL="postgresql://user:pass@localhost:5432/foreman?schema=public"
pnpm install
pnpm --filter @foreman/server db:generate   # may need a few retries in sandbox (engine download)
pnpm build && pnpm typecheck && pnpm test
```

Server boot smoke: `/api/health` → 200, unauthenticated `/api/projects` → 401.

## TODO / open follow-ups (not yet done)

- [ ] Real end-to-end run needs runtime secrets: `DATABASE_URL`, `ANTHROPIC_API_KEY`,
      `CLAUDE_CODE_OAUTH_TOKEN`, GitHub OAuth app (callback `<APP_URL>/api/github/callback`).
      Full setup guide (local dev + Railway deploy, all-encompassing): `setup-instructions.md`
      at repo root (custom domain `foreman.fireflyrise.com` via Namecheap CNAME → Railway
      custom domain); `railway.json` makes Railway build `docker/Dockerfile` with healthcheck
      `/api/health`. GOTCHA: Railway auto-splits the pnpm monorepo into two Nixpacks services
      (`server`+`web`) — discard that and use ONE Dockerfile service (root dir empty, builder
      Dockerfile, path `docker/Dockerfile`). Documented in setup-instructions.md Part B step 3.
- [ ] Flip PR #1 out of draft → ready-for-review, then merge when desired.
- [ ] Crash/resume of in-memory sessions across server restarts (schema stores
      `sdkSessionId`; resume via SDK `options.resume` not wired yet).
- [ ] Gate "merge as you go" on a green Railway deploy (currently merges optimistically).
- [ ] Optional: global default auth mode for new projects; per-project monthly API spend cap.
- [ ] Two simultaneous sessions on the *same* repo would need git worktrees (currently
      one checkout per project).

## Operational notes for continuing

- PR monitoring: subscribed to PR #1 activity; an hourly cron self-check re-polls
  CI/mergeability and re-arms silently. Stop once PR is merged/closed.
- Commit trailers required:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` and the `Claude-Session:` line.
- Don't commit build output (`dist/`) or `.env` — see `.gitignore`.
- The model identifier must stay out of commits/PRs/code (chat only).
