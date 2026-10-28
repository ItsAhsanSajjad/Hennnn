import { prisma } from "@/lib/database/prisma";
import {
  generateReferralCode,
  isReferralCodeShape,
  normalizeReferralCode,
} from "@/lib/validation/referrals";

export async function createUniqueReferralCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const referralCode = generateReferralCode();
    const existing = await prisma.user.findUnique({
      where: { referralCode },
      select: { id: true },
    });

    if (!existing) {
      return referralCode;
    }
  }

  throw new Error("Unable to generate a unique referral code.");
}

export async function getReferralPreview(referralCode: string | null | undefined) {
  const normalized = normalizeReferralCode(referralCode);

  if (!normalized || !isReferralCodeShape(normalized)) {
    return null;
  }

  const inviter = await prisma.user.findUnique({
    where: {
      referralCode: normalized,
    },
    select: {
      id: true,
      username: true,
      status: true,
    },
  });

  if (!inviter || inviter.status !== "ACTIVE") {
    return null;
  }

  return {
    inviterId: inviter.id,
    inviterUsername: inviter.username,
    referralCode: normalized,
  };
}
