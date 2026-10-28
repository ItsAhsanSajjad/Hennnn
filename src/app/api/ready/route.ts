import { NextResponse } from "next/server";

import { prisma } from "@/lib/database/prisma";

const READINESS_TIMEOUT_MS = 2_000;

export async function GET() {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("readiness-timeout")), READINESS_TIMEOUT_MS),
      ),
    ]);

    return NextResponse.json({ ok: true, service: "pakhen", dependencies: { database: "ok" } });
  } catch {
    return NextResponse.json(
      { ok: false, service: "pakhen", dependencies: { database: "unavailable" } },
      { status: 503 },
    );
  }
}
