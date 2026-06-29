# Foreman — Autonomous Vibe-Coding Orchestrator

A self-hosted web tool that **acts as you** when vibe-coding with Claude Code. Connect your
GitHub, pick a repo per project, set a goal plus an ordered instruction list, and Foreman
drives the Claude Agent SDK autonomously — one instruction at a time, branching and merging
to `main` as it goes, pulling Railway error logs to self-heal failed deploys.

> ⚠️ Foreman runs Claude Code in **full-bypass** mode (`bypassPermissions`): the agent can run
> arbitrary commands against your repos. Only run it behind the login gate, with narrowly
> scoped tokens, and never expose it unauthenticated.

## Architecture

A TypeScript monorepo (pnpm + Turborepo):

```
packages/shared   # shared types, zod schemas, SSE event types
apps/server       # Fastify API + Claude Agent SDK orchestration (SSE streaming)
apps/web          # React + Vite + Tailwind SPA
```

- **Engine:** `@anthropic-ai/claude-agent-sdk` `query()` in streaming-input mode — one
  long-lived session per project. The next instruction is sent only after the previous
  turn's `result` message (`apps/server/src/agent/AgentSession.ts`).
- **Autonomy:** `permissionMode: "bypassPermissions"` + a never-ask system-prompt append
  carrying the goal/limitations/reasoning (`apps/server/src/agent/prompts.ts`).
- **Git:** backend creates a `session/<id>/<ts>` branch; the agent commits/pushes; the
  backend opens/merges PRs per `mergePolicy` (`apps/server/src/git/RepoManager.ts`).
- **Integrations:** GitHub OAuth + repo listing, Railway GraphQL logs (also an MCP tool the
  agent can call), Gemini "nano banana" logo generation.
- **Secrets:** AES-256-GCM at rest (`apps/server/src/crypto/secrets.ts`).

### Two modules per project

1. **Software Creator** — rewritable goal + ordered, reorderable instruction list.
2. **Web Creator** — brand form (company, industry, accent color, logo upload or Gemini
   generation) that seeds a website-build instruction set and runs the same engine.

## Setup

**Full instructions — local development and production deploy — live in
[`setup-instructions.md`](setup-instructions.md).**

That single guide covers local dev, deploying to Railway (with the
`foreman.fireflyrise.com` custom domain on Namecheap), connecting GitHub / Railway logs /
Gemini, and error monitoring. Quick local start:

```bash
pnpm install
pnpm db:migrate    # needs a running Postgres + DATABASE_URL
pnpm dev           # server on :3001, web on :5173
```

## Tests

```bash
pnpm test        # vitest: secrets round-trip, instruction-inbox sequencing
pnpm typecheck
pnpm build
```
