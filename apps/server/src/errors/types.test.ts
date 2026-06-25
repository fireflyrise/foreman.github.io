import { describe, expect, it } from "vitest";
import { DEFAULT_SEVERITY, ErrorType } from "./types.js";

describe("error types", () => {
  it("every ErrorType has a default severity", () => {
    for (const code of Object.values(ErrorType)) {
      expect(DEFAULT_SEVERITY[code], `missing severity for ${code}`).toBeDefined();
    }
  });

  it("constant name matches its string value (grep-ability)", () => {
    for (const [name, value] of Object.entries(ErrorType)) {
      expect(value).toBe(name);
    }
  });

  it("only uses valid severity levels", () => {
    const valid = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
    for (const sev of Object.values(DEFAULT_SEVERITY)) {
      expect(valid.has(sev)).toBe(true);
    }
  });
});
