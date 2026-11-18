// Security primitives for the admin: password hashing (scrypt + per-user salt)
// and session-token hashing. node:crypto is imported dynamically so this module
// is safe to reference from code that is also bundled for the client; the Node
// APIs only load when a function actually runs on the server.

/** Hashes a password as "scrypt:<saltHex>:<hashHex>". */
export async function hashPassword(password: string): Promise<string> {
  const { randomBytes, scrypt } = await import("node:crypto");
  const salt = randomBytes(16);
  const derived = await new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, 32, (err, key) =>
      err ? reject(err) : resolve(key as Buffer),
    ),
  );
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

/** Constant-time check of a password against a stored "scrypt:…" hash. */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const { scrypt, timingSafeEqual } = await import("node:crypto");
  const salt = Buffer.from(parts[1]!, "hex");
  const expected = Buffer.from(parts[2]!, "hex");
  if (expected.length === 0) return false;
  const derived = await new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, expected.length, (err, key) =>
      err ? reject(err) : resolve(key as Buffer),
    ),
  );
  return (
    expected.length === derived.length && timingSafeEqual(expected, derived)
  );
}

/** Hashes a raw session token; only the hash is stored. */
export async function hashToken(raw: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(raw, "utf8").digest("hex");
}
