import { describe, expect, it } from "vitest";
import { MAX_FILE_BYTES, sha256Hex, validateFileSize } from "@/lib/hash";

describe("file rules", () => {
  it("allows files up to exactly 100 MB", () => {
    expect(validateFileSize(100 * 1024 * 1024)).toBeNull();
  });
  it("rejects files over 100 MB", () => {
    expect(validateFileSize(MAX_FILE_BYTES + 1)).not.toBeNull();
  });
  it("computes SHA-256", async () => {
    const h = await sha256Hex(new TextEncoder().encode("abc").buffer as ArrayBuffer);
    expect(h).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});
