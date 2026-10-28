import { NextResponse, type NextRequest } from "next/server";

import { REFERRAL_COOKIE_NAME, useSecureCookies } from "@/lib/auth/session";
import { normalizeReferralCode } from "@/lib/validation/referrals";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ referralCode: string }> },
) {
  const { referralCode } = await params;
  const normalized = normalizeReferralCode(referralCode);
  const targetUrl = new URL(`/sign-up?ref=${encodeURIComponent(normalized)}`, request.url);
  const response = NextResponse.redirect(targetUrl, 307);

  response.cookies.set(REFERRAL_COOKIE_NAME, normalized, {
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookies,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
