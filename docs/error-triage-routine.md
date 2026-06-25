# Error Triage Routine

A scheduled Claude Code session that reads the durable `ErrorLog` table, fixes the
recurring/real bugs, and marks them resolved. Run it on a **daily** cadence.

This is **part 3** of the error system. Parts 1 and 2 (the `ErrorLog` table written
from every catch block, and the HIGH/CRITICAL digest notifier) run inside the app on
the hosting platform. This routine is the human-in-the-loop-optional cleanup loop.

> **Intentionally NOT a log drain or third-party APM (Sentry/Datadog).** The app-owned
> table + digest + this triage loop is the whole system. The platform just runs the
> containers.

## Prerequisite: database access

This routine **must** run in an environment that can reach the **production
`DATABASE_URL`** (the same Postgres the deployed app writes to).

⚠️ **Cloud / sandboxed Claude sessions usually CANNOT reach the prod database**
(no network route, secret not present). If `pnpm --filter @foreman/server errors:report`
fails to connect, run this routine from an environment that has prod DB access — e.g.:
- a `railway run` shell (injects the service env), or
- locally with `DATABASE_URL` exported to the prod connection string (read-only user
  preferred for the read phase), or
- a CI job / cron box that holds the prod `DATABASE_URL` secret.

If you cannot reach the DB, **stop and report that** — do not guess at errors from
stdout or invent fixes.

## How to run

Schedule a daily Claude Code session in a DB-reachable environment and paste the
**Prompt** below. The session uses one helper:

```bash
# Ranked, grouped, unresolved errors from the last 7 days (machine-readable):
pnpm --filter @foreman/server errors:report -- --json --days 7
```

Each error's `errorType` is a stable, grep-able constant defined in
`apps/server/src/errors/types.ts` and written at exactly one (or a few) catch
site(s) — so `errorType` → code location is a simple `grep`.

---

## Prompt (paste into the scheduled session)

> You are the daily error-triage operator for the Foreman app. Work against the
> production `ErrorLog` table. Follow these steps exactly and respect every guardrail.
>
> **0. Confirm DB access.** Run `pnpm --filter @foreman/server errors:report -- --json --days 7`.
> If it cannot connect to the database, STOP and report "no prod DB access" — do not
> proceed or fabricate findings.
>
> **1. Pull & rank.** From that report, take all `resolved = false` rows from the last
> 7 days, already grouped by `errorType` with occurrence counts. Triage in this order:
> CRITICAL first, then HIGH, then recurring (count > 1) before one-off. Ignore MEDIUM/LOW
> unless they are recurring heavily (a noisy MEDIUM is worth a look).
>
> **2. Locate & understand each type.** For each `errorType`, `grep` the codebase for the
> constant (e.g. `grep -rn AGENT_GIT_PR_FAILURE apps/server/src`). Read the surrounding
> code and the rows' `errorContext` (ids/params). Then categorize the type as ONE of:
> - **real-bug** — a defect in our code (null deref, bad assumption, race, logic error).
> - **external-transient** — a dependency hiccup (network blip, 5xx/429 from GitHub/
>   Railway/Gemini/Anthropic, timeout) that retrying would survive.
> - **config-credential** — missing/invalid env var, expired token, wrong ID, unset
>   webhook. Our code is correct; the environment is wrong.
> - **stale** — already fixed in a later commit, or no longer reproducible.
>
> **3. Act per category.**
> - **real-bug** (low-risk, high-confidence only): fix it. Create a branch, make the
>   minimal change, open a **draft PR**, wait for **green CI**, then merge. One PR per
>   `errorType` (or per tightly-related cluster). If the fix is large, risky, or
>   uncertain — do NOT code it; write a one-line action item and leave the rows unresolved.
> - **external-transient**: add a bounded retry with backoff and/or a guard at the call
>   site (cap attempts; don't loop forever). Same branch → draft PR → green CI → merge.
> - **config-credential**: do NOT code around it. Write a single, specific operator
>   action item (e.g. "set `ALERT_WEBHOOK_URL` on the Railway service", "rotate the
>   GitHub OAuth token"). Leave the rows unresolved until the operator confirms.
> - **stale**: just mark resolved (step 4).
>
> **4. Resolve — only when truly done.** Set `resolved = true, resolvedAt = now()` for a
> type's rows ONLY when the cause is actually fixed (PR merged) or confirmed external and
> handled (retry/guard merged, or it's a one-off transient you're acknowledging). Use a
> guarded SQL update scoped to that `errorType` and the time window, e.g.:
>
> ```sql
> UPDATE "ErrorLog"
> SET resolved = true, "resolvedAt" = now()
> WHERE "errorType" = '<TYPE>' AND resolved = false AND "createdAt" >= now() - interval '7 days';
> ```
>
> Do NOT mark config-credential rows resolved until the operator confirms the fix.
>
> **5. Report.** Summarize: per `errorType` — category, action taken (PR link / action
> item / resolved-stale), and counts. List anything you deliberately left for a human.

---

## Guardrails (hard rules)

- **Never push straight to `main`.** Always branch → draft PR → green CI → merge
  (this matches the repo's standing auto-merge-after-CI workflow).
- **Never weaken or disable logging/`recordError` to lower the count.** Reducing
  visibility is not a fix. The count drops only when the underlying cause is resolved.
- **No schema migrations or large refactors** as part of triage. If a fix needs either,
  stop and flag it as an action item for a human to scope.
- **Only auto-fix low-risk, high-confidence bugs.** When unsure, write an action item
  and leave the rows `resolved = false`.
- **Only set `resolved = true` when the cause is fixed or confirmed external** — never
  to clear the dashboard.

## Reference

- Table & indexes: `apps/server/prisma/schema.prisma` (`model ErrorLog`).
- Error codes & default severities: `apps/server/src/errors/types.ts`.
- Writer (used in every catch): `apps/server/src/errors/store.ts` (`recordError`).
- Notifier (HIGH/CRITICAL digest): `apps/server/src/errors/notifier.ts`.
- Report helper: `apps/server/src/scripts/error-report.ts`.
