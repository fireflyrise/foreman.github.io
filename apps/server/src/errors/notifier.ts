import type { ErrorLog } from "@prisma/client";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { recordError } from "./store.js";
import { ErrorType } from "./types.js";

/**
 * Scheduled notifier: scans for unsent HIGH/CRITICAL errors and pushes a single
 * digest to a webhook (Slack incoming-webhook or any JSON endpoint), then stamps
 * notifiedAt so the same error never re-alerts. MEDIUM/LOW are never paged —
 * they stay in the table for triage.
 *
 * Note: NOTIFIER_FAILURE is intentionally MEDIUM so a webhook outage never
 * feeds back into the HIGH/CRITICAL alert path (no self-alert loop).
 */

let timer: ReturnType<typeof setInterval> | null = null;
let running = false;

function formatDigest(rows: ErrorLog[]): string {
  const lines = rows.map((r) => {
    const ts = r.createdAt.toISOString();
    const firstLine = r.errorMessage.split("\n")[0] ?? "";
    return `• [${r.severity}] ${r.errorType} — ${firstLine} (${r.project}, ${ts})`;
  });
  const crit = rows.filter((r) => r.severity === "CRITICAL").length;
  const high = rows.filter((r) => r.severity === "HIGH").length;
  return `🚨 Foreman error digest — ${crit} CRITICAL, ${high} HIGH\n${lines.join("\n")}`;
}

export async function runNotifierOnce(): Promise<number> {
  if (!env.alertWebhookUrl) return 0;

  const rows = await prisma.errorLog.findMany({
    where: {
      resolved: false,
      notifiedAt: null,
      severity: { in: ["HIGH", "CRITICAL"] },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  if (rows.length === 0) return 0;

  const res = await fetch(env.alertWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: formatDigest(rows),
      errors: rows.map((r) => ({
        id: r.id,
        project: r.project,
        errorType: r.errorType,
        severity: r.severity,
        message: r.errorMessage.split("\n")[0],
        createdAt: r.createdAt.toISOString(),
      })),
    }),
  });
  if (!res.ok) {
    throw new Error(`Alert webhook returned ${res.status}: ${await res.text()}`);
  }

  // Stamp only after a successful send so failures retry next cycle.
  await prisma.errorLog.updateMany({
    where: { id: { in: rows.map((r) => r.id) } },
    data: { notifiedAt: new Date() },
  });
  return rows.length;
}

export function startNotifier(): void {
  if (!env.alertWebhookUrl) {
    console.warn(
      "[notifier] ALERT_WEBHOOK_URL not set — HIGH/CRITICAL errors are recorded but not paged.",
    );
    return;
  }
  if (timer) return;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const n = await runNotifierOnce();
      if (n > 0) console.log(`[notifier] sent digest for ${n} error(s)`);
    } catch (err) {
      // MEDIUM so it doesn't re-enter the HIGH/CRITICAL alert path.
      await recordError({
        errorType: ErrorType.NOTIFIER_FAILURE,
        error: err,
        project: "notifier",
      });
    } finally {
      running = false;
    }
  };
  timer = setInterval(() => void tick(), env.alertPollIntervalMs);
  // Don't keep the event loop alive solely for the notifier.
  if (typeof timer.unref === "function") timer.unref();
  console.log(`[notifier] started (every ${Math.round(env.alertPollIntervalMs / 1000)}s)`);
}

export function stopNotifier(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
