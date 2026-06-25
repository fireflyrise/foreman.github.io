/**
 * Triage report: unresolved errors from the last N days, grouped by errorType,
 * ranked CRITICAL/HIGH and recurring-first. Run against the production
 * DATABASE_URL. Consumed by the error-triage routine (docs/error-triage-routine.md).
 *
 *   pnpm --filter @foreman/server errors:report            # last 7 days, text
 *   pnpm --filter @foreman/server errors:report -- --json  # machine-readable
 *   pnpm --filter @foreman/server errors:report -- --days 14
 */
import { prisma } from "../db.js";

const SEVERITY_RANK: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

async function main() {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const daysIdx = args.indexOf("--days");
  const days = daysIdx >= 0 ? Number(args[daysIdx + 1]) || 7 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await prisma.errorLog.findMany({
    where: { resolved: false, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });

  const groups = new Map<
    string,
    {
      errorType: string;
      severity: string;
      count: number;
      projects: Set<string>;
      latestMessage: string;
      latestAt: string;
      sampleContext: unknown;
      ids: string[];
    }
  >();

  for (const r of rows) {
    const g = groups.get(r.errorType);
    if (g) {
      g.count += 1;
      g.projects.add(r.project);
      g.ids.push(r.id);
      if (SEVERITY_RANK[r.severity]! < SEVERITY_RANK[g.severity]!) g.severity = r.severity;
    } else {
      groups.set(r.errorType, {
        errorType: r.errorType,
        severity: r.severity,
        count: 1,
        projects: new Set([r.project]),
        latestMessage: r.errorMessage.split("\n")[0] ?? "",
        latestAt: r.createdAt.toISOString(),
        sampleContext: r.errorContext,
        ids: [r.id],
      });
    }
  }

  const ranked = [...groups.values()].sort((a, b) => {
    const sev = SEVERITY_RANK[a.severity]! - SEVERITY_RANK[b.severity]!;
    if (sev !== 0) return sev;
    return b.count - a.count; // recurring before one-off
  });

  const out = ranked.map((g) => ({
    errorType: g.errorType,
    severity: g.severity,
    count: g.count,
    recurring: g.count > 1,
    projects: [...g.projects],
    latestMessage: g.latestMessage,
    latestAt: g.latestAt,
    sampleContext: g.sampleContext,
    exampleIds: g.ids.slice(0, 5),
  }));

  if (json) {
    console.log(JSON.stringify({ windowDays: days, totalUnresolved: rows.length, groups: out }, null, 2));
  } else {
    console.log(`Unresolved errors (last ${days}d): ${rows.length} rows, ${out.length} types\n`);
    for (const g of out) {
      console.log(
        `[${g.severity}] ${g.errorType}  ×${g.count}${g.recurring ? " (recurring)" : ""}` +
          `  projects=${g.projects.join(",")}`,
      );
      console.log(`    latest: ${g.latestMessage}  @ ${g.latestAt}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
