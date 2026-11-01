/** Hashes a password using Bun's salted Argon2id implementation. */
export function hashPassword(value: string): Promise<string> {
  return Bun.password.hash(value, { algorithm: "argon2id", memoryCost: 65536, timeCost: 2 });
}

/** Verifies the complete password against a stored password hash. */
export function verifyPassword(value: string, hash: string): Promise<boolean> {
  return Bun.password.verify(value, hash, "argon2id");
}
