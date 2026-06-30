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
- [x] Fix "no Run button" in the Agent Console: `AgentConsole.tsx` wrongly counted the
      `idle` session status as "running", so before a session started (and after one
      completed) the console showed a red **Stop** button instead of **▶ Run** — there was
      no way to start. `idle` is the pre-start / post-completion state; removed it from the
      `running` condition so idle/stopped/completed/error all show **▶ Run**, while
      running/awaiting_next/limit_paused show **Stop**.
- [x] Per-tab delete with type-to-confirm: each project tab now has an **✕** button
      (`ProjectTabs.tsx`). It opens `DeleteProjectDialog.tsx`, which (a) refuses deletion
      while the project is running — session status in idle/running/awaiting_next/
      limit_paused — showing "cannot be deleted while it is running", and (b) otherwise
      requires the user to TYPE the exact project name before the Delete button enables.
      The server already guards this (DELETE returns 409 "Stop the running session before
      deleting" via `SessionRegistry.isRunning`); the dialog surfaces that message on 409
      as a fallback. Removed the redundant top-right "Delete" button from `ProjectView`;
      deletion is centralized on the tab ✕. `Workspace` clears the active selection when
      the open project is deleted. Delete does NOT touch the GitHub repo.
- [x] Per-module billing auth, both directions: Module 1 (Software) already had a Max/API
      dropdown defaulting to **Max subscription**. Module 2 (Web) used to be hardcoded to the
      API key; it now has its OWN dropdown (`webAuthMode`, new `Project` column, default
      **api**) in the Web Creator form, so the owner can flip a project's site build to the
      Max subscription for their own web apps while client work stays on the API key.
      New: `Project.webAuthMode` + migration `4_add_web_auth_mode`, `SetWebAuthModeInput`,
      `ProjectDTO.webAuthMode`, PUT `/api/projects/:id/web-auth-mode`, `api.setWebAuthMode`,
      and the web-creator run now reads `project.webAuthMode` instead of forcing "api".
- [x] Automatic end-of-session Railway deploy check + self-heal: after ALL instructions
      have run and merged to main, `AgentSession.autoRailwayDeployCheck()` (called from
      `maybeMergeAtEnd`) probes that Railway is configured, then emits a status log
      ("Waiting 5 minutes for the Railway deployment to build and go live…"), keeps the
      session in "running" so Stop stays available, waits a fixed `DEPLOY_WAIT_MS` (5 min),
      then pulls the latest deploy status via `fetchLatestLogs`. If the deploy FAILED it
      grabs the logs and injects a fix instruction (`injectRailwayFix`) so the run resumes
      and self-heals; on success it logs ✅ and finalizes. Bounded by `MAX_RAILWAY_AUTOFIX`
      (2) to avoid infinite loops; skips silently if Railway isn't configured or under the
      MANUAL merge policy. The manual ↻ Railway button still works any time mid-run. This
      replaces "merge optimistically with no post-deploy verification" from the old TODO.
      DETECTION: the auto-check fires ONLY for projects with an explicit per-project
      `railwayProjectId` (set via the ↻ Railway dialog). It deliberately does NOT fall back
      to the account-wide Railway default — otherwise a static GitHub Pages project (no
      Railway) would falsely match the account default and check the wrong service. No
      per-project Railway link = treated as "not on Railway" = skipped.

- [x] Fix SSE `ERR_HTTP2_PROTOCOL_ERROR` + stuck "running" session: the agent stream
      (`GET /session/stream`) set `Connection: keep-alive`, a connection-specific header
      FORBIDDEN in HTTP/2 (RFC 7540 §8.1.2.2). Railway's edge is HTTP/2, so the browser
      killed the stream → console froze and Stop appeared to do nothing (the stop status
      event never arrived). Fix: only send `Connection` on HTTP/1.x (`req.raw.httpVersionMajor
      < 2`), `flushHeaders()`, and emit `retry: 3000`. Also made restarts recoverable:
      `SessionRegistry.stop` now marks a non-terminal DB session stopped when no live session
      exists, and `reconcileOnBoot()` (called from `index.ts` startup) marks orphaned
      non-terminal sessions stopped — in-memory sessions don't survive a redeploy (crash-
      resume still a TODO), so this prevents a dead "running" row with a no-op Stop button.

- [x] Instruction attachments (files/photos per instruction, like Claude web): new
      `InstructionAttachment` table (migration `5_instruction_attachments`) storing base64
      (~20MB cap), 1:N from `Instruction`. UI (`InstructionList.tsx`): 📎 on each row to
      attach, chips with ✕ to remove, and staging on the add-row (files attach to the next
      instruction created). API: `POST/DELETE /api/projects/:id/instructions/:instrId/
      attachments[/:attId]`, `AddAttachmentInput`, `api.addAttachment/deleteAttachment`,
      `InstructionDTO.attachments` (metadata only — base64 never shipped to the list).
      RUN-TIME: `AgentSession.dispatchInstruction` (sendNext is now async via this) calls
      `materializeAttachments` to write the files to `<workspacesDir>/<projectId>__attachments/
      <instructionId>/` (OUTSIDE the git repo so they're not auto-committed), then appends
      their absolute paths + mime types to the instruction message so Claude Code can Read
      them and act ("swap in this image", "follow this skill file"). Use case examples baked
      into the UI helper text.

- [x] CI-gated PR merge + self-heal (fixes "PR opened but never merged/closed"): the old
      flow opened a PR then IMMEDIATELY squash-merged in the same step — before GitHub had
      computed mergeability or CI had passed — so the merge 405'd, was swallowed by the
      `.catch`, and the PR was left open. New `AgentSession.mergeWhenGreen` + `waitForPrReady`
      poll the PR (`getPrCiState`: check-runs + commit statuses + mergeable_state) up to
      `PR_CI_WAIT_MS` (5 min, every 8s). GREEN → squash-merge + clear pointer. RED → inject a
      CI-fix instruction (`buildCiFixMessage`) at the FRONT of the queue so the agent repairs
      it and CI re-runs (bounded by `MAX_CI_FIX`=2). "behind" → `updatePrBranch` then retry.
      conflict/timeout/exhausted → leave PR open + log (never merge broken code). Applies to
      PER_INSTRUCTION (handleGitForInstruction) and PER_SESSION (maybeMergeAtEnd, which now
      resumes the loop if a CI fix was queued). NOTE: also, redeploying Foreman kills the
      in-memory session (no crash-resume yet), which can orphan an open project PR — that's a
      separate known gap.

- [x] Paste-to-attach images: `InstructionList.tsx` now handles `onPaste` on the edit-row
      TextInput (uploads the pasted image straight to that instruction via `uploadFiles`) and
      the add-row TextInput (stages it for the next instruction). `imagesFromClipboard` pulls
      image items off the clipboard and gives each a unique `pasted-<ts>-<i>.<ext>` name so
      same-named pastes don't collide on disk. Builds on the existing attachment system.

- [x] Clear Agent Console button: `useAgentStream` exposes `clear()` (empties on-screen
      lines, view-only); `AgentConsole` has a "Clear" ghost button (disabled when empty).
      Live events keep appending after; a refresh replays persisted history from the DB.

- [x] Serialize instructions on merge (fix: instruction marked done + next started while PR
      still open → conflicts). `onTurnResult` no longer marks the instruction done before the
      git step; `handleGitForInstruction`/`mergeWhenGreen` now return an outcome
      ("merged"|"healing"|"blocked"|"noop"). The instruction is marked **done only after its
      PR actually merges**; the **next instruction starts only on "merged"/"noop"**. New
      `mergingInstruction` field tracks the real instruction across synthetic CI-fix sub-steps
      so it's completed only when its PR lands. On "blocked" (conflict / CI timeout / merge
      rejected / fixes exhausted) the session STOPS with a clear message instead of starting
      the next instruction on unmerged work. "healing" (CI red → fix injected) keeps the
      instruction running and runs the fix before re-merging. Hard turn failure also stops.

- [x] Live instruction-badge updates: the console streamed in real time but the instruction
      status badges (running→done) only updated on refetch/refresh, since `InstructionList`
      reads from the cached `["projects"]` query. `useAgentStream` now patches that cache on
      every `instruction_status` SSE event (`patchInstructionStatus` via `qc.setQueryData`),
      so badges flip live without a refresh.

- [x] Fix convo.md (and other every-instruction files) merge conflicts: the session branch
      was cut from main ONCE and never re-synced, so after each PER_INSTRUCTION squash-merge
      the branch kept its old (squashed-away) commits and DIVERGED from main — files edited
      every instruction (esp. `convo.md`) collided, leaving `<<<<<<< session/... ===== >>>>>>>
      main` markers. Fix: `RepoManager.resyncBranchToDefault(branch)` does
      `fetch + reset --hard origin/<default> + force-push` after a successful merge (called
      from `mergeWhenGreen`), re-basing the session branch onto the freshly-merged main so the
      NEXT instruction starts from a clean copy. Each instruction's PR is now a single-
      instruction diff off current main; no divergence. (Session branch is disposable, so the
      hard reset + force-push is safe.)

- [x] Merge-after-all-instructions default + selector: changed the default `mergePolicy` to
      **PER_SESSION** (one PR, merged once after ALL instructions complete) — schema default +
      migration `6_default_merge_per_session`. Added `SetMergePolicyInput`, PUT
      `/api/projects/:id/merge-policy`, `api.setMergePolicy`, and a "merge:" dropdown in the
      ProjectView header (after all instructions / after each instruction / manual) so existing
      projects (e.g. adspulse, still PER_INSTRUCTION) can switch. BUGFIX needed for this to
      work: PER_SESSION used to open the PR as a DRAFT, and a draft PR can't be merged — the
      end-of-session `mergeWhenGreen` would have failed. Now PRs are never opened as draft
      (Foreman merges them itself). PER_SESSION flow with the recent changes: each instruction
      returns "noop" (proceed, mark done), one PR accumulates all commits, `maybeMergeAtEnd`
      runs `mergeWhenGreen` once (CI-gated + self-heal), then the Railway deploy check.

- [x] Foreman branding: gold crown logo + favicon. `apps/web/public/logo.svg` (hand-authored
      gold crown, crisp at any size, doubles as favicon); `index.html` links it as the icon;
      the Workspace header shows it next to "Foreman" (replaced the ⚙️ emoji). Vite auto-copies
      `public/` → `dist/` → Docker stages it into the server's `public/`, served at `/logo.svg`.
      NOTE: user pasted PNGs but a chat-pasted image can't be reconstructed to exact bytes;
      using an SVG crown so it works immediately. To use the user's EXACT files, drop
      `apps/web/public/logo.png` + `favicon.png` and switch the two refs.
- [x] User uploaded real `logo.png` + `favicon.png` to the branch (commit "Add files via
      upload"). Switched header `<img>` → `/logo.png`, favicon link → `/favicon.png` (png),
      removed the placeholder `logo.svg`. Both PNGs bundle to `dist/` and serve at root.
- [x] Refreshed `logo.png` + `favicon.png` with the user's re-uploaded versions (no code
      change — refs already point at these filenames).

- [x] UX: unified the per-module billing control + renamed "auth"→"billing". Previously the
      header showed "software auth" (Module 1) even on the Module 2 tab, AND the Web Creator
      form showed a separate "web auth" dropdown — two controls at once, confusing, and "auth"
      wrongly implies access/permissions. Now ONE header dropdown labeled "billing (Software|
      Web):" reflects the ACTIVE module (reads/writes `authMode` on Module 1, `webAuthMode` on
      Module 2 via `changeAuthMode`/`changeWebAuthMode`). Removed the duplicate "web auth"
      selector from `WebCreatorForm`. It selects which credential the run bills against (Max
      subscription vs pay-as-you-go API key).

- [x] Add Project type-first flow: "+ Add Project" now opens a TYPE picker (two cards):
      **Software project** — "Create/update full software solutions"; **Web project** —
      "Create/update full websites based on our internal template". Picking one advances to the
      repo picker (with a ‹ back button). New `Project.projectType` ("software"|"web", default
      software, migration `7_project_type`); `ProjectType` zod enum; `CreateProjectInput
      .projectType`; `ProjectDTO.projectType`; create route + serializer store it; client
      passes it. `ProjectView` opens to the matching module (web→Module 2, else Module 1) — the
      module toggle stays so you can still switch.
- [x] Removed the Module 1/Module 2 toggle: now that a project has a fixed type, `ProjectView`
      derives `module` from `project.projectType` (no switching) and renders only that module's
      screens; replaced the toggle with a static "Software project" / "Web project" label.

- [x] Web Creator action placement: the "Generate website" button was buried at the bottom of
      the long form and unclear about whether it runs. Moved Generate + Save into a STICKY
      header bar at the top of the Web Creator panel (stays visible while scrolling), renamed
      to "▶ Generate & build" / "Save draft", with helper text clarifying that Generate seeds
      the build steps and STARTS THE RUN IMMEDIATELY (it does — `run()` calls
      `api.runWebCreator` which seeds instructions + starts the session). Removed the old
      bottom action block.

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
