import crypto from "node:crypto";
import { env } from "../env.js";

/**
 * AES-256-GCM encryption for integration tokens stored at rest.
 *
 * The on-disk blob format is: base64( iv(12) || authTag(16) || ciphertext ).
 * The key comes from MASTER_ENCRYPTION_KEY (base64 or hex, 32 bytes decoded).
 */

const IV_LEN = 12;
const TAG_LEN = 16;

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = env.masterEncryptionKey;
  if (!raw) {
    throw new Error(
      "MASTER_ENCRYPTION_KEY is not set. Generate one with `openssl rand -base64 32`.",
    );
  }
  let key: Buffer;
  // Try base64 first, then hex.
  const b64 = Buffer.from(raw, "base64");
  if (b64.length === 32) {
    key = b64;
  } else {
    const hex = Buffer.from(raw, "hex");
    if (hex.length === 32) {
      key = hex;
    } else {
      throw new Error(
        "MASTER_ENCRYPTION_KEY must decode to exactly 32 bytes (base64 or hex).",
      );
    }
  }
  cachedKey = key;
  return key;
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

export function decryptSecret(blob: string): string {
  const buf = Buffer.from(blob, "base64");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ct = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

/** Encrypt a JSON-serializable credential object. */
export function encryptJson(value: unknown): string {
  return encryptSecret(JSON.stringify(value));
}

export function decryptJson<T = unknown>(blob: string): T {
  return JSON.parse(decryptSecret(blob)) as T;
}
