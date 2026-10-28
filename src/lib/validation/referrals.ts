import { createSecureToken } from "@/lib/security/tokens";

const referralAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReferralCode(length = 10) {
  const bytes = Buffer.from(createSecureToken(length), "utf8");
  let code = "";

  for (let index = 0; index < length; index += 1) {
    code += referralAlphabet[bytes[index % bytes.length] % referralAlphabet.length];
  }

  return code;
}

export function normalizeReferralCode(code: string | null | undefined) {
  return (code ?? "").trim().toUpperCase();
}

export function isReferralCodeShape(code: string) {
  return /^[A-Z2-9]{6,24}$/.test(normalizeReferralCode(code));
}
