import { createHmac, timingSafeEqual } from "crypto";
import { JWT_SECRET, TOKEN_TTL_SECONDS } from "../config";
import type { User } from "./users";

export interface TokenPayload {
  sub: number;
  role: User["role"];
  iat: number;
  exp: number;
}

function getSecret(): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not defined");
  }
  return JWT_SECRET;
}

export function createAccessToken(
  user: Pick<User, "id" | "role">,
  options?: { expiresIn?: number }
): string {
  const secret = getSecret();
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresIn = options?.expiresIn ?? TOKEN_TTL_SECONDS;
  const payload: TokenPayload = {
    sub: user.id,
    role: user.role,
    iat: issuedAt,
    exp: issuedAt + expiresIn,
  };
  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(payloadEncoded).digest("base64url");
  return `${payloadEncoded}.${signature}`;
}

export function verifyAccessToken(token: string): TokenPayload {
  const secret = getSecret();
  const parts = token.split(".");
  if (parts.length !== 2) {
    throw new Error("Invalid token format");
  }
  const [payloadPart, signaturePart] = parts;
  const expectedSignature = createHmac("sha256", secret).update(payloadPart).digest("base64url");
  const expectedBuffer = Buffer.from(expectedSignature, "base64url");
  const providedBuffer = Buffer.from(signaturePart, "base64url");
  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    throw new Error("Invalid token signature");
  }
  const payloadJson = Buffer.from(payloadPart, "base64url").toString();
  const payload = JSON.parse(payloadJson) as TokenPayload;
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    throw new Error("Token expired");
  }
  return payload;
}
