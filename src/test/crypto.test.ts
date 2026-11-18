import { describe, expect, it } from "vitest";
import { hashPassword, hashToken, verifyPassword } from "@/lib/rpc/crypto";

describe("password hashing", () => {
  it("verifies a correct password and rejects a wrong one", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash.startsWith("scrypt:")).toBe(true);
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(
      true,
    );
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });

  it("uses a random salt, so the same password hashes differently", async () => {
    const a = await hashPassword("same-password");
    const b = await hashPassword("same-password");
    expect(a).not.toBe(b);
    expect(await verifyPassword("same-password", a)).toBe(true);
    expect(await verifyPassword("same-password", b)).toBe(true);
  });

  it("rejects malformed stored hashes", async () => {
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "plain:aa:bb")).toBe(false);
    expect(await verifyPassword("x", "scrypt::")).toBe(false);
  });
});

describe("session-token hashing", () => {
  it("is deterministic and never returns the raw token", async () => {
    const raw = "abc123";
    const h1 = await hashToken(raw);
    const h2 = await hashToken(raw);
    expect(h1).toBe(h2);
    expect(h1).not.toBe(raw);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashToken("abc124")).not.toBe(h1);
  });
});
