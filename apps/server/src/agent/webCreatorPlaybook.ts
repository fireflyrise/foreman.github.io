import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../env.js";

/**
 * Loads the WebCreator playbook (the full website-building methodology, stored
 * verbatim from the original skill) and writes a per-project copy that the
 * orchestrated agent reads and follows for Module 2 builds.
 *
 * Resolves the same whether running from src (dev/tsx) or dist (prod):
 * <pkg>/src/agent or <pkg>/dist/agent → ../../playbook/webcreator.md.
 */
const PLAYBOOK_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../playbook/webcreator.md",
);

let cached: string | null = null;

export function loadPlaybook(): string {
  if (cached) return cached;
  cached = fs.readFileSync(PLAYBOOK_PATH, "utf8");
  return cached;
}

/**
 * Write the playbook to a stable path OUTSIDE the cloned repo (so it never gets
 * committed to the client's project) and return the absolute path the agent
 * should read.
 */
export function writePlaybookForProject(projectId: string): string {
  const dir = path.resolve(env.workspacesDir);
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, `${projectId}.webcreator-playbook.md`);
  fs.writeFileSync(dest, loadPlaybook(), "utf8");
  return dest;
}
