import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32;

export function generatePasswordResetToken() {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  const tokenHash = hashPasswordResetToken(token);

  return { token, tokenHash };
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
