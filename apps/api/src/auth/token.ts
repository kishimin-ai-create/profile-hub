import { sign, verify } from "hono/jwt";

export type TokenKind = "access" | "refresh";
export type SessionClaims = {
  sub: string;
  version: number;
  kind: TokenKind;
  jti: string;
  iat: number;
  exp: number;
  authTime: number;
};

const issuer = "profile-hub";
const audience = "profile-hub-admin";
const tokenLifetime = (kind: TokenKind) => (kind === "access" ? 15 * 60 : 24 * 60 * 60);
const absoluteLifetime = 7 * 24 * 60 * 60;

function validSubject(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[1-9][0-9]{0,18}$/.test(value) &&
    BigInt(value) <= 9223372036854775807n
  );
}

/** Validates the minimum encoding length of the signing secret. */
export function requireSecret(secret: string) {
  if (new TextEncoder().encode(secret).length < 32) {
    throw new Error("JWT secret must be at least 32 bytes");
  }
}

/** Issues a signed token with a bounded lifetime and unique identifier. */
export async function issueToken(
  subject: string,
  version: number,
  kind: TokenKind,
  secret: string,
  authenticationTime?: number,
) {
  requireSecret(secret);
  if (!validSubject(subject) || !Number.isSafeInteger(version) || version < 0) {
    throw new Error("Invalid session claims");
  }
  const issuedAt = Math.floor(Date.now() / 1000);
  const authTime = authenticationTime ?? issuedAt;
  if (
    !Number.isSafeInteger(authTime) ||
    authTime < 0 ||
    authTime > issuedAt ||
    authTime + absoluteLifetime <= issuedAt
  ) {
    throw new Error("Invalid authentication time");
  }
  return sign(
    {
      iss: issuer,
      aud: audience,
      sub: subject,
      version,
      kind,
      jti: crypto.randomUUID(),
      iat: issuedAt,
      auth_time: authTime,
      exp: Math.min(issuedAt + tokenLifetime(kind), authTime + absoluteLifetime),
    },
    secret,
    "HS256",
  );
}

/** Verifies the signature, required claims, token kind and expiration. */
export async function verifyToken(
  token: string,
  kind: TokenKind,
  secret: string,
): Promise<SessionClaims | null> {
  requireSecret(secret);
  if (!token || token.length > 4096) {
    return null;
  }
  try {
    const payload = await verify(token, secret, { alg: "HS256", iss: issuer, aud: audience });
    const { sub, version, jti, iat, exp, auth_time: authTime } = payload;
    if (
      !validSubject(sub) ||
      typeof version !== "number" ||
      !Number.isSafeInteger(version) ||
      version < 0 ||
      payload["kind"] !== kind ||
      typeof jti !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(jti) ||
      typeof iat !== "number" ||
      !Number.isSafeInteger(iat) ||
      typeof exp !== "number" ||
      !Number.isSafeInteger(exp) ||
      typeof authTime !== "number" ||
      !Number.isSafeInteger(authTime) ||
      authTime < 0 ||
      authTime > iat ||
      exp <= iat ||
      exp > authTime + absoluteLifetime ||
      exp - iat > tokenLifetime(kind)
    ) {
      return null;
    }
    return { sub, version, kind, jti, iat, exp, authTime };
  } catch {
    return null;
  }
}
