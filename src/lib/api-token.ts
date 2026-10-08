import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const PREFIX = "nih_";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** A new random token. 32 bytes of entropy, so a plain SHA-256 is enough to store. */
export function generateToken(): { token: string; hash: string; prefix: string } {
  const token = PREFIX + randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token), prefix: token.slice(0, 8) };
}

/** Resolves a bearer token to its owner, or null if unknown or revoked. */
export async function verifyToken(header: string | null): Promise<{ id: string; owner: string } | null> {
  const token = header?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token?.startsWith(PREFIX)) return null;

  const row = await prisma.apiToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.revokedAt) return null;

  // Fire-and-forget, like logEvent: a bookkeeping write must not fail the read.
  prisma.apiToken
    .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
    .catch((e) => console.error("[api-token] lastUsedAt", e));

  return { id: row.id, owner: row.owner };
}
