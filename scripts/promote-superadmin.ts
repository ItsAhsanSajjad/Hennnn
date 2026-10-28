import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { normalizePakistaniPhone, normalizeUsername } from "../src/lib/validation/auth";
import { createAuditLog } from "../src/server/services/audit";

function readFlag(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1]?.trim() : undefined;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const username = readFlag("--username");
  const phone = readFlag("--phone");
  const confirmed = process.argv.includes("--confirm");

  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  if ((!username && !phone) || (username && phone) || !confirmed) {
    throw new Error(
      "Usage: pnpm admin:promote -- --username <existing-user> --confirm (or use --phone <Pakistani-number>).",
    );
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg(databaseUrl) });
  try {
    const phoneResult = phone ? normalizePakistaniPhone(phone) : null;
    if (phone && !phoneResult?.ok) throw new Error("Provide a valid Pakistani phone number.");
    const user = await prisma.user.findFirst({
      where: username
        ? { usernameNormalized: normalizeUsername(username) }
        : { phoneE164: phoneResult?.phoneE164 },
    });
    if (!user || user.deletedAt) throw new Error("An active existing user was not found.");

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { role: "SUPER_ADMIN", status: "ACTIVE" },
      });
      await createAuditLog(
        {
          actorUserId: user.id,
          action: "USER_ROLE_CHANGED",
          entityType: "User",
          entityId: user.id,
          metadata: {
            previousRole: user.role,
            role: "SUPER_ADMIN",
            reason: "Explicit local first-admin promotion command",
          },
        },
        tx,
      );
    });
    console.log(`Promoted ${user.username} to SUPER_ADMIN.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Promotion failed.");
  process.exit(1);
});
