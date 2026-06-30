import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { WebCreatorInput } from "@foreman/shared";
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

const ASSET_FIELDS = [
  "logoUrl",
  "faviconLightUrl",
  "faviconDarkUrl",
  "heroImageUrl",
  "ogImageUrl",
] as const;

function extForMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("svg")) return "svg";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("icon")) return "ico";
  return "img";
}

/**
 * Decode any base64 data-URL image fields (logo, favicons, hero, OG) to files
 * OUTSIDE the cloned repo and return a spec COPY where those fields hold the
 * absolute file path instead of a multi-MB data URL. This keeps the build brief
 * tiny and lets the agent just copy the files in — no base64 decoding (which is
 * what previously made the build appear to hang).
 */
export function materializeWebAssets(projectId: string, spec: WebCreatorInput): WebCreatorInput {
  const dir = path.resolve(env.workspacesDir, `${projectId}__webassets`);
  let made = false;
  const copy = { ...spec } as Record<string, unknown>;
  for (const field of ASSET_FIELDS) {
    const v = spec[field];
    if (typeof v !== "string") continue;
    const m = /^data:([^;]+);base64,(.*)$/s.exec(v);
    const mime = m?.[1];
    const b64 = m?.[2];
    if (!mime || !b64) continue;
    if (!made) {
      fs.mkdirSync(dir, { recursive: true });
      made = true;
    }
    const file = path.join(dir, `${field}.${extForMime(mime)}`);
    fs.writeFileSync(file, Buffer.from(b64, "base64"));
    copy[field] = file;
  }
  return copy as WebCreatorInput;
}
