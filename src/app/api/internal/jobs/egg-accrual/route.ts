import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env/server";
import { eggAccrualRequestSchema } from "@/lib/validation/phase2";
import { runEggAccrual } from "@/server/services/egg-accrual";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isValidJobSecret(actual: string | null, expected: string | undefined) {
  if (!actual || !expected || expected.length < 32 || actual.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export async function POST(request: Request) {
  const secret = request.headers.get("x-job-secret");
  if (!isValidJobSecret(secret, env.EGG_ACCRUAL_JOB_SECRET)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = eggAccrualRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid job payload" }, { status: 400 });
  }
  if (parsed.data.date && new Date(`${parsed.data.date}T00:00:00.000Z`) > new Date()) {
    return NextResponse.json(
      { error: "Future production dates are not allowed." },
      { status: 400 },
    );
  }

  const result = await runEggAccrual({
    productionDate: parsed.data.date,
    dryRun: parsed.data.dryRun,
  });
  return NextResponse.json(result);
}
