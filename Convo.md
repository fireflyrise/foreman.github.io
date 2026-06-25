# Convo.md — Foreman build state & handoff

> Living progress log so work can continue from any new branch. Read this first.
> Last updated: 2026-06-25.

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
- Working branch: `claude/sweet-heisenberg-yeek0y`.
- An empty `main` baseline commit was created so the PR diff shows the whole project.
- **PR #1** (draft): https://github.com/fireflyrise/foreman.github.io/pull/1
- CI is green on the latest commit. PR is still a **draft** (not yet merged).

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

## Status — DONE

- [x] Monorepo scaffold, shared types, Fastify + Vite skeletons, Prisma/Postgres.
- [x] AES-256-GCM secrets, single-user login gate.
- [x] GitHub OAuth + repo listing + backend PR/merge; RepoManager clone/branch.
- [x] Railway GraphQL logs (REST + MCP tool + failure self-heal injection).
- [x] Gemini "nano banana" logo generation (REST + MCP tool).
- [x] Agent engine + Module 1 (goal editor, drag-reorderable instructions, SSE console).
- [x] Module 2 (web-creator form, logo upload/generate) reusing the engine.
- [x] Per-module auth modes + per-project override + Max-limit notify/choose.
- [x] GitHub Actions CI (typecheck · test · build) — green on PR #1.
- [x] Initial Prisma migrations; Dockerfile for Railway.
- [x] Vitest: AsyncInbox sequencing + secrets round-trip/tamper (6/6 pass).

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
