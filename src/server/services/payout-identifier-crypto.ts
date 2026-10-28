import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { env } from "@/lib/env/server";

const version = "v1";

function payoutAccountKey() {
  const material = env.PAYOUT_ACCOUNT_ENCRYPTION_KEY ?? env.AUTH_SECRET;
  return createHash("sha256")
    .update("pakhen:payout-account-encryption:")
    .update(material)
    .digest();
}

export function encryptPayoutIdentifier(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", payoutAccountKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value.trim(), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${version}.${Buffer.concat([iv, ciphertext, tag]).toString("base64url")}`;
}

export function decryptPayoutIdentifier(value: string | null | undefined) {
  if (!value?.startsWith(`${version}.`)) return null;

  try {
    const payload = Buffer.from(value.slice(version.length + 1), "base64url");
    if (payload.length <= 28) return null;
    const iv = payload.subarray(0, 12);
    const tag = payload.subarray(payload.length - 16);
    const ciphertext = payload.subarray(12, payload.length - 16);
    const decipher = createDecipheriv("aes-256-gcm", payoutAccountKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
