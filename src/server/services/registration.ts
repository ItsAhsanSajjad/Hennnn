import { Prisma } from "@prisma/client";

import { brand } from "@/config/brand";
import { prisma } from "@/lib/database/prisma";
import { hashPassword } from "@/lib/security/passwords";
import {
  normalizePakistaniPhone,
  normalizeUsername,
  validatePassword,
  validateUsername,
} from "@/lib/validation/auth";
import { isReferralCodeShape, normalizeReferralCode } from "@/lib/validation/referrals";
import { createAuditLog } from "@/server/services/audit";
import { createUniqueReferralCode, getReferralPreview } from "@/server/services/referrals";

type RegistrationInput = {
  username: string;
  phone: string;
  password: string;
  referralCode?: string;
};

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

export type RegistrationResult =
  | { ok: true; userId: string; referralCode: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function registerUserAccount(
  input: RegistrationInput,
  meta: RequestMeta = {},
): Promise<RegistrationResult> {
  const username = validateUsername(input.username);
  if (!username.ok) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: { username: [username.message] },
    };
  }

  const phone = normalizePakistaniPhone(input.phone);
  if (!phone.ok) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: { phone: [phone.message] },
    };
  }

  const password = validatePassword(input.password);
  if (!password.ok) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: { password: [password.message] },
    };
  }

  const referralCode = normalizeReferralCode(input.referralCode);
  const referralPreview = referralCode ? await getReferralPreview(referralCode) : null;

  if (referralCode && (!isReferralCodeShape(referralCode) || !referralPreview)) {
    return {
      ok: false,
      message: "The referral code could not be verified.",
      fieldErrors: {
        referralCode: ["Enter a valid active referral code or leave the field blank."],
      },
    };
  }

  const passwordHash = await hashPassword(input.password);
  const newReferralCode = await createUniqueReferralCode();

  try {
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: input.username.trim(),
          usernameNormalized: normalizeUsername(input.username),
          phoneE164: phone.phoneE164,
          passwordHash,
          referralCode: newReferralCode,
          status: "ACTIVE",
          role: "USER",
        },
      });

      await tx.legalAcceptance.createMany({
        data: [
          {
            userId: user.id,
            documentType: "TERMS",
            documentVersion: brand.legal.termsVersion,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
          },
          {
            userId: user.id,
            documentType: "PRIVACY",
            documentVersion: brand.legal.privacyVersion,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
          },
        ],
      });

      if (referralPreview) {
        await tx.referralRelationship.create({
          data: {
            inviterId: referralPreview.inviterId,
            inviteeId: user.id,
            sourceCode: referralPreview.referralCode,
          },
        });

        await createAuditLog(
          {
            actorUserId: user.id,
            action: "REFERRAL_ATTACHED",
            entityType: "ReferralRelationship",
            entityId: user.id,
            metadata: { sourceCode: referralPreview.referralCode },
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
          },
          tx,
        );
      }

      await tx.notification.create({
        data: {
          userId: user.id,
          type: "ACCOUNT",
          title: "Welcome to GrowMeta Egg",
          message:
            "Your account foundation is ready. Poultry transactions arrive in the next phase.",
        },
      });

      await createAuditLog(
        {
          actorUserId: user.id,
          action: "USER_REGISTERED",
          entityType: "User",
          entityId: user.id,
          metadata: { referralSupplied: Boolean(referralPreview) },
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
        tx,
      );

      return user;
    });

    return { ok: true, userId: created.id, referralCode: created.referralCode };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : "";
      const detail = `${target} ${error.message}`;
      if (detail.includes("usernameNormalized")) {
        return {
          ok: false,
          message: "Please correct the highlighted fields.",
          fieldErrors: { username: ["This username is already registered."] },
        };
      }
      if (detail.includes("phoneE164")) {
        return {
          ok: false,
          message: "Please correct the highlighted fields.",
          fieldErrors: { phone: ["This phone number is already registered."] },
        };
      }
    }

    return {
      ok: false,
      message: "Registration could not be completed safely. Please try again.",
    };
  }
}
