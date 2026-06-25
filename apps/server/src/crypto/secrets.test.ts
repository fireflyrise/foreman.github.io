import { beforeAll, describe, expect, it } from "vitest";
import crypto from "node:crypto";

describe("secrets", () => {
  beforeAll(() => {
    process.env.MASTER_ENCRYPTION_KEY = crypto.randomBytes(32).toString("base64");
  });

  it("round-trips a string through encrypt/decrypt", async () => {
    const { encryptSecret, decryptSecret } = await import("./secrets.js");
    const plain = "ghp_supersecrettoken_12345";
    const blob = encryptSecret(plain);
    expect(blob).not.toContain(plain);
    expect(decryptSecret(blob)).toBe(plain);
  });

  it("round-trips JSON credentials", async () => {
    const { encryptJson, decryptJson } = await import("./secrets.js");
    const cred = { accessToken: "abc", projectId: "p1" };
    const blob = encryptJson(cred);
    expect(decryptJson(blob)).toEqual(cred);
  });

  it("tamper detection: a modified blob fails to decrypt", async () => {
    const { encryptSecret, decryptSecret } = await import("./secrets.js");
    const blob = encryptSecret("data");
    const buf = Buffer.from(blob, "base64");
    const last = buf.length - 1;
    buf.writeUInt8(buf.readUInt8(last) ^ 0xff, last); // flip last ciphertext byte
    const tampered = buf.toString("base64");
    expect(() => decryptSecret(tampered)).toThrow();
  });
});
