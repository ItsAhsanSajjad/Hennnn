import type { EggMarket, EggMarketPayoutMethod, EggMarketSale, EggMarketSaleStatus, Prisma, PrismaClient, User } from "@prisma/client";
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/database/prisma";
import { createEggMarketSaleReference } from "@/lib/utilities/phase3";
import { canAdjustLedger, canReviewEggSales } from "@/server/policies/authorization";
import { createAuditLog } from "@/server/services/audit";
import { getAvailableEggBalance } from "@/server/services/egg-ledger";
import { decryptPayoutIdentifier, encryptPayoutIdentifier } from "@/server/services/payout-identifier-crypto";

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export interface EggMarketWithEligibility extends EggMarket {
  pricePerEggRs: number;
  isEligible: boolean;
  eggsNeeded: number;
  maxSellableForUser: number;
  status: "eligible" | "insufficient_eggs" | "paused" | "inactive";
}

export function normalizePakistaniMobile(input: string): string {
  const digitsOnly = input.replace(/\D/g, "");
  if (digitsOnly.startsWith("923") && digitsOnly.length === 12) {
    return `0${digitsOnly.slice(2)}`;
  }
  if (digitsOnly.startsWith("03") && digitsOnly.length === 11) {
    return digitsOnly;
  }
  if (digitsOnly.startsWith("3") && digitsOnly.length === 10) {
    return `0${digitsOnly}`;
  }
  return input.trim();
}

export function isValidPakistaniMobile(input: string): boolean {
  const normalized = normalizePakistaniMobile(input);
  return /^03\d{9}$/.test(normalized);
}

export function maskPakistaniMobile(phone: string): string {
  const normalized = normalizePakistaniMobile(phone);
  if (/^03\d{9}$/.test(normalized)) {
    return `${normalized.slice(0, 4)}••••${normalized.slice(-3)}`;
  }
  return phone.length > 4 ? `••••${phone.slice(-4)}` : "••••";
}

export async function getEggMarkets(userId?: string): Promise<EggMarketWithEligibility[]> {
  const [markets, availableEggs] = await Promise.all([
    prisma.eggMarket.findMany({
      where: {
        archivedAt: null,
        isActive: true,
      },
      orderBy: [{ displayOrder: "asc" }, { minEggs: "asc" }],
    }),
    userId ? getAvailableEggBalance(userId) : Promise.resolve(0),
  ]);

  const usableBalance = Math.max(0, availableEggs);

  const mapped: EggMarketWithEligibility[] = markets.map((market) => {
    const pricePerEggRs = Number(market.pricePerEggPaisa) / 100;
    const isEligible = usableBalance >= market.minEggs && !market.isPaused && market.isActive;
    const eggsNeeded = Math.max(0, market.minEggs - usableBalance);
    const maxSellableForUser = Math.min(usableBalance, market.maxEggs);

    let status: EggMarketWithEligibility["status"] = "eligible";
    if (!market.isActive) {
      status = "inactive";
    } else if (market.isPaused) {
      status = "paused";
    } else if (!isEligible) {
      status = "insufficient_eggs";
    }

    return {
      ...market,
      pricePerEggRs,
      isEligible,
      eggsNeeded,
      maxSellableForUser,
      status,
    };
  });

  return mapped.sort((a, b) => {
    const score = (m: EggMarketWithEligibility) => {
      if (m.status === "eligible") return 1;
      if (m.status === "insufficient_eggs") return 2;
      return 3;
    };
    const diff = score(a) - score(b);
    if (diff !== 0) return diff;
    return a.displayOrder - b.displayOrder;
  });
}

export async function getEggMarketStats(userId: string) {
  const [availableEggs, reservedAgg, salesAgg, markets] = await Promise.all([
    getAvailableEggBalance(userId),
    prisma.eggMarketSale.aggregate({
      where: {
        userId,
        status: { in: ["PENDING_PAYMENT", "PROCESSING"] },
      },
      _sum: { eggQuantity: true, totalAmountPaisa: true },
    }),
    prisma.eggMarketSale.aggregate({
      where: { userId, status: { in: ["PAID", "COMPLETED"] } },
      _count: { id: true },
      _sum: { eggQuantity: true, totalAmountPaisa: true },
    }),
    prisma.eggMarket.findMany({
      where: { archivedAt: null, isActive: true, isPaused: false },
      orderBy: { pricePerEggPaisa: "desc" },
    }),
  ]);

  const usableBalance = Math.max(0, availableEggs);
  const reservedEggs = reservedAgg._sum.eggQuantity ?? 0;
  const pendingPayoutAmountRs = Number(reservedAgg._sum.totalAmountPaisa ?? 0n) / 100;

  // Find highest rate among markets user is eligible for
  const eligibleMarkets = markets.filter((m) => usableBalance >= m.minEggs);
  const bestAvailableMarket = eligibleMarkets[0] ?? markets[0];
  const bestAvailableRateRs = bestAvailableMarket
    ? Number(bestAvailableMarket.pricePerEggPaisa) / 100
    : 10;

  const highestEligibleRatePaisa = eligibleMarkets[0]?.pricePerEggPaisa ?? 0n;
  const estimatedMaxValueRs =
    highestEligibleRatePaisa > 0n
      ? (Number(highestEligibleRatePaisa) / 100) * usableBalance
      : (bestAvailableRateRs * usableBalance);

  return {
    availableEggs: usableBalance,
    reservedEggs,
    pendingPayoutAmountRs,
    bestAvailableRateRs,
    estimatedMaxValueRs,
    completedSalesCount: salesAgg._count.id,
    totalEggsSold: salesAgg._sum.eggQuantity ?? 0,
    totalEarnedPaisa: salesAgg._sum.totalAmountPaisa ?? 0n,
    totalEarnedRs: Number(salesAgg._sum.totalAmountPaisa ?? 0n) / 100,
  };
}

export async function getUserEggMarketSales(userId: string, limit = 20) {
  return prisma.eggMarketSale.findMany({
    where: { userId },
    include: {
      market: {
        select: {
          id: true,
          name: true,
          code: true,
          icon: true,
          imagePath: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUserActiveEggPayouts(userId: string) {
  return prisma.eggMarketSale.findMany({
    where: {
      userId,
      status: { in: ["PENDING_PAYMENT", "PROCESSING"] },
    },
    include: {
      market: {
        select: {
          id: true,
          name: true,
          code: true,
          icon: true,
          imagePath: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function requestEggMarketSalePayout({
  userId,
  marketId,
  eggQuantity,
  payoutMethod,
  accountHolderName,
  accountNumber,
  idempotencyKey,
}: {
  userId: string;
  marketId: string;
  eggQuantity: number;
  payoutMethod: EggMarketPayoutMethod;
  accountHolderName: string;
  accountNumber: string;
  idempotencyKey: string;
}) {
  if (!Number.isInteger(eggQuantity) || eggQuantity <= 0) {
    throw new Error("Invalid egg quantity. Must be a positive whole number.");
  }

  const cleanedHolderName = accountHolderName.trim();
  if (!cleanedHolderName || cleanedHolderName.length < 2 || cleanedHolderName.length > 100) {
    throw new Error("Please enter a valid account holder name (2-100 characters).");
  }

  const normalizedPhone = normalizePakistaniMobile(accountNumber);
  if (!isValidPakistaniMobile(normalizedPhone)) {
    throw new Error("Please enter a valid 11-digit Pakistani mobile number (e.g., 03001234567).");
  }

  const maskedPhone = maskPakistaniMobile(normalizedPhone);
  const encryptedHolder = encryptPayoutIdentifier(cleanedHolderName);
  const encryptedNumber = encryptPayoutIdentifier(normalizedPhone);

  return prisma.$transaction(async (tx) => {
    // Advisory lock on user for safe concurrency
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!user || user.status !== "ACTIVE" || user.deletedAt) {
      throw new Error("Your account is not active or eligible to sell eggs.");
    }

    // Check market validity
    const market = await tx.eggMarket.findUnique({
      where: { id: marketId },
    });

    if (!market || market.archivedAt || !market.isActive) {
      throw new Error("Selected egg market is currently inactive or unavailable.");
    }

    if (market.isPaused) {
      throw new Error("This egg market is currently paused. Please choose another market.");
    }

    if (eggQuantity < market.minEggs) {
      throw new Error(
        `Minimum sale quantity for ${market.name} is ${market.minEggs} eggs.`
      );
    }

    if (eggQuantity > market.maxEggs) {
      throw new Error(
        `Maximum sale quantity for ${market.name} is ${market.maxEggs} eggs per transaction.`
      );
    }

    // Check capacity if configured
    if (
      market.totalCapacityEggs !== null &&
      market.totalEggsPurchased + eggQuantity > market.totalCapacityEggs
    ) {
      throw new Error("This market has reached its total purchase capacity.");
    }

    // Check user's live available egg balance
    const availableEggs = await getAvailableEggBalance(userId, tx);
    if (availableEggs < eggQuantity) {
      throw new Error(
        `Insufficient egg balance. You have ${availableEggs} eggs available, but requested to sell ${eggQuantity}.`
      );
    }

    const pricePerEggPaisa = market.pricePerEggPaisa;
    const totalAmountPaisa = BigInt(eggQuantity) * pricePerEggPaisa;
    const pricePerEggRs = Number(pricePerEggPaisa) / 100;
    const publicReference = createEggMarketSaleReference();
    const saleId = randomUUID();

    // 1. Create debit in EggLedgerEntry (Reserves the eggs)
    const ledgerEntry = await tx.eggLedgerEntry.create({
      data: {
        userId,
        entryType: "SALE_RESERVATION",
        eggUnits: -eggQuantity,
        description: `Reserved ${eggQuantity} eggs for payout from ${market.name} via ${payoutMethod} (${maskedPhone})`,
        sourceType: "EGG_SALE",
        sourceId: saleId,
        idempotencyKey: `egg-market-payout-ledger:${userId}:${idempotencyKey}`,
        metadata: {
          saleId,
          marketId: market.id,
          marketName: market.name,
          payoutMethod,
          accountNumberMasked: maskedPhone,
          pricePerEggPaisa: pricePerEggPaisa.toString(),
          totalAmountPaisa: totalAmountPaisa.toString(),
        },
      },
    });

    // 2. Create EggMarketSale record in PENDING_PAYMENT status
    const sale = await tx.eggMarketSale.create({
      data: {
        id: saleId,
        publicReference,
        userId,
        marketId: market.id,
        eggQuantity,
        pricePerEggPaisaSnapshot: pricePerEggPaisa,
        totalAmountPaisa,
        payoutMethod,
        accountHolderNameProtected: encryptedHolder,
        accountNumberProtected: encryptedNumber,
        accountNumberMasked: maskedPhone,
        status: "PENDING_PAYMENT",
        submittedAt: new Date(),
        eggLedgerEntryId: ledgerEntry.id,
        idempotencyKey,
        metadata: {
          marketName: market.name,
          pricePerEggRs,
          totalAmountRs: Number(totalAmountPaisa) / 100,
          payoutMethod,
        },
      },
      include: {
        market: true,
      },
    });

    // 3. Increment market's total eggs purchased
    await tx.eggMarket.update({
      where: { id: market.id },
      data: {
        totalEggsPurchased: { increment: eggQuantity },
      },
    });

    // 4. Audit Log
    await createAuditLog(
      {
        actorUserId: userId,
        action: "EGG_PAYOUT_SUBMITTED",
        entityType: "EggMarketSale",
        entityId: sale.id,
        metadata: {
          publicReference,
          marketId: market.id,
          marketName: market.name,
          eggQuantity,
          totalAmountPaisa: totalAmountPaisa.toString(),
          payoutMethod,
          accountNumberMasked: maskedPhone,
        },
      },
      tx,
    );

    return sale;
  });
}

// Backward-compatible alias
export const executeEggMarketSale = requestEggMarketSalePayout;

export async function getAdminEggMarkets() {
  return prisma.eggMarket.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    include: {
      _count: {
        select: { sales: true },
      },
    },
  });
}

export async function getAdminEggMarketSales({
  search,
  status,
  payoutMethod,
  page = 1,
  limit = 30,
}: {
  search?: string;
  status?: string;
  payoutMethod?: string;
  page?: number;
  limit?: number;
}) {
  const where: Prisma.EggMarketSaleWhereInput = {};

  if (status && status !== "ALL") {
    where.status = status as EggMarketSaleStatus;
  }

  if (payoutMethod && payoutMethod !== "ALL") {
    where.payoutMethod = payoutMethod as EggMarketPayoutMethod;
  }

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { publicReference: { contains: q, mode: "insensitive" } },
      { accountNumberMasked: { contains: q } },
      { user: { username: { contains: q, mode: "insensitive" } } },
      { user: { phoneE164: { contains: q } } },
      { market: { name: { contains: q, mode: "insensitive" } } },
      { adminTransactionId: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, sales, statusCounts] = await Promise.all([
    prisma.eggMarketSale.count({ where }),
    prisma.eggMarketSale.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            phoneE164: true,
            email: true,
          },
        },
        market: {
          select: {
            id: true,
            name: true,
            code: true,
            icon: true,
            imagePath: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.eggMarketSale.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const counts: Record<string, number> = {
    ALL: 0,
    PENDING_PAYMENT: 0,
    PROCESSING: 0,
    PAID: 0,
    REJECTED: 0,
    CANCELLED: 0,
  };

  statusCounts.forEach((sc) => {
    counts[sc.status] = sc._count.id;
    counts.ALL += sc._count.id;
  });

  return {
    sales,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    counts,
  };
}

export async function getAdminEggSaleDetails(saleId: string, actor: Pick<User, "id" | "role">) {
  if (!canReviewEggSales(actor.role)) {
    throw new Error("You are not authorized to view egg payout details.");
  }

  const sale = await prisma.eggMarketSale.findUnique({
    where: { id: saleId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          phoneE164: true,
          email: true,
        },
      },
      market: true,
      reviewedBy: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  if (!sale) {
    throw new Error("Egg market payout record not found.");
  }

  const decryptedHolderName = decryptPayoutIdentifier(sale.accountHolderNameProtected);
  const decryptedAccountNumber = decryptPayoutIdentifier(sale.accountNumberProtected);

  return {
    ...sale,
    accountHolderNameDecrypted: decryptedHolderName ?? "Encrypted",
    accountNumberDecrypted: decryptedAccountNumber ?? sale.accountNumberMasked ?? "Encrypted",
  };
}

export async function markEggPayoutProcessing({
  actor,
  saleId,
  notes,
}: {
  actor: Pick<User, "id" | "role">;
  saleId: string;
  notes?: string;
}) {
  if (!canReviewEggSales(actor.role)) {
    throw new Error("You are not authorized to process egg payouts.");
  }

  return prisma.$transaction(async (tx) => {
    const sale = await tx.eggMarketSale.findUnique({
      where: { id: saleId },
    });

    if (!sale) {
      throw new Error("Payout record not found.");
    }

    if (sale.status !== "PENDING_PAYMENT") {
      throw new Error(`Payout is currently ${sale.status} and cannot be moved to Processing.`);
    }

    const updated = await tx.eggMarketSale.update({
      where: { id: saleId },
      data: {
        status: "PROCESSING",
        processingAt: new Date(),
        reviewedByUserId: actor.id,
        adminNotes: notes?.trim() || sale.adminNotes,
      },
    });

    await createAuditLog(
      {
        actorUserId: actor.id,
        action: "EGG_PAYOUT_PROCESSING",
        entityType: "EggMarketSale",
        entityId: sale.id,
        metadata: {
          publicReference: sale.publicReference,
          notes,
        },
      },
      tx,
    );

    return updated;
  });
}

export async function markEggPayoutPaid({
  actor,
  saleId,
  adminTransactionId,
  notes,
}: {
  actor: Pick<User, "id" | "role">;
  saleId: string;
  adminTransactionId: string;
  notes?: string;
}) {
  if (!canReviewEggSales(actor.role)) {
    throw new Error("You are not authorized to approve egg payouts.");
  }

  const cleanTxnId = adminTransactionId.trim();
  if (!cleanTxnId || cleanTxnId.length < 3) {
    throw new Error("Please enter a valid Transaction ID / Reference (minimum 3 characters).");
  }

  return prisma.$transaction(async (tx) => {
    const sale = await tx.eggMarketSale.findUnique({
      where: { id: saleId },
      include: { market: true },
    });

    if (!sale) {
      throw new Error("Payout record not found.");
    }

    if (sale.status !== "PENDING_PAYMENT" && sale.status !== "PROCESSING") {
      throw new Error(`Payout is already ${sale.status} and cannot be marked as Paid.`);
    }

    // Update sale status to PAID
    const updated = await tx.eggMarketSale.update({
      where: { id: saleId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        reviewedByUserId: actor.id,
        adminTransactionId: cleanTxnId,
        adminNotes: notes?.trim() || sale.adminNotes,
      },
    });

    await createAuditLog(
      {
        actorUserId: actor.id,
        action: "EGG_PAYOUT_PAID",
        entityType: "EggMarketSale",
        entityId: sale.id,
        metadata: {
          publicReference: sale.publicReference,
          adminTransactionId: cleanTxnId,
          totalAmountPaisa: sale.totalAmountPaisa.toString(),
          notes,
        },
      },
      tx,
    );

    return updated;
  });
}

export async function rejectEggPayout({
  actor,
  saleId,
  reason,
  notes,
}: {
  actor: Pick<User, "id" | "role">;
  saleId: string;
  reason: string;
  notes?: string;
}) {
  if (!canReviewEggSales(actor.role)) {
    throw new Error("You are not authorized to reject egg payouts.");
  }

  const cleanReason = reason.trim();
  if (!cleanReason || cleanReason.length < 5) {
    throw new Error("A clear rejection reason (at least 5 characters) is required.");
  }

  return prisma.$transaction(async (tx) => {
    const sale = await tx.eggMarketSale.findUnique({
      where: { id: saleId },
      include: { market: true },
    });

    if (!sale) {
      throw new Error("Payout record not found.");
    }

    if (sale.status !== "PENDING_PAYMENT" && sale.status !== "PROCESSING") {
      throw new Error(`Payout is currently ${sale.status} and cannot be rejected.`);
    }

    // Lock user for safety
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${sale.userId}))`;

    // 1. Release reserved eggs back to user with positive SALE_RELEASE entry
    const releaseLedger = await tx.eggLedgerEntry.create({
      data: {
        userId: sale.userId,
        entryType: "SALE_RELEASE",
        eggUnits: sale.eggQuantity, // Positive credits eggs back
        description: `Returned ${sale.eggQuantity} eggs from rejected payout ${sale.publicReference}: ${cleanReason}`,
        sourceType: "EGG_SALE",
        sourceId: sale.id,
        reversedEntryId: sale.eggLedgerEntryId,
        idempotencyKey: `egg-payout-rejection-release:${sale.id}:${randomUUID()}`,
        metadata: {
          saleId: sale.id,
          publicReference: sale.publicReference,
          reason: cleanReason,
          rejectedByUserId: actor.id,
        },
      },
    });

    // 2. Decrement market purchased count
    await tx.eggMarket.update({
      where: { id: sale.marketId },
      data: {
        totalEggsPurchased: { decrement: sale.eggQuantity },
      },
    });

    // 3. Update sale record to REJECTED
    const updated = await tx.eggMarketSale.update({
      where: { id: saleId },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        reviewedByUserId: actor.id,
        rejectionReason: cleanReason,
        adminNotes: notes?.trim() || sale.adminNotes,
        reversalEggLedgerEntryId: releaseLedger.id,
      },
    });

    // 4. Audit Log
    await createAuditLog(
      {
        actorUserId: actor.id,
        action: "EGG_PAYOUT_REJECTED",
        entityType: "EggMarketSale",
        entityId: sale.id,
        metadata: {
          publicReference: sale.publicReference,
          userId: sale.userId,
          eggQuantity: sale.eggQuantity,
          reason: cleanReason,
        },
      },
      tx,
    );

    return updated;
  });
}

export async function cancelEggPayoutByUser({
  userId,
  saleId,
  reason = "Cancelled by user",
}: {
  userId: string;
  saleId: string;
  reason?: string;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;

    const sale = await tx.eggMarketSale.findUnique({
      where: { id: saleId },
      include: { market: true },
    });

    if (!sale) {
      throw new Error("Payout request not found.");
    }

    if (sale.userId !== userId) {
      throw new Error("You are not authorized to cancel this payout request.");
    }

    if (sale.status !== "PENDING_PAYMENT") {
      throw new Error("Only pending payout requests can be cancelled. Please contact support if your request is already processing.");
    }

    // Release eggs back
    const releaseLedger = await tx.eggLedgerEntry.create({
      data: {
        userId,
        entryType: "SALE_RELEASE",
        eggUnits: sale.eggQuantity,
        description: `Returned ${sale.eggQuantity} eggs from cancelled payout ${sale.publicReference}`,
        sourceType: "EGG_SALE",
        sourceId: sale.id,
        reversedEntryId: sale.eggLedgerEntryId,
        idempotencyKey: `egg-payout-user-cancel:${sale.id}:${randomUUID()}`,
        metadata: {
          saleId: sale.id,
          publicReference: sale.publicReference,
          cancelledByUserId: userId,
        },
      },
    });

    await tx.eggMarket.update({
      where: { id: sale.marketId },
      data: {
        totalEggsPurchased: { decrement: sale.eggQuantity },
      },
    });

    const updated = await tx.eggMarketSale.update({
      where: { id: saleId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        rejectionReason: reason,
        reversalEggLedgerEntryId: releaseLedger.id,
      },
    });

    await createAuditLog(
      {
        actorUserId: userId,
        action: "EGG_PAYOUT_CANCELLED",
        entityType: "EggMarketSale",
        entityId: sale.id,
        metadata: {
          publicReference: sale.publicReference,
          eggQuantity: sale.eggQuantity,
        },
      },
      tx,
    );

    return updated;
  });
}

export async function reverseEggMarketSale({
  actor,
  saleId,
  reason,
}: {
  actor: Pick<User, "id" | "role">;
  saleId: string;
  reason: string;
}) {
  if (!canAdjustLedger(actor.role)) {
    throw new Error("You are not authorized to reverse egg market sales.");
  }

  return prisma.$transaction(async (tx) => {
    const sale = await tx.eggMarketSale.findUnique({
      where: { id: saleId },
      include: { market: true },
    });

    if (!sale) {
      throw new Error("Egg market sale record not found.");
    }

    if (sale.status !== "COMPLETED" && sale.status !== "PAID") {
      throw new Error(`Sale is already ${sale.status.toLowerCase()} and cannot be reversed.`);
    }

    // Lock user
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${sale.userId}))`;

    // 1. Compensatory EggLedgerEntry (credit eggs back)
    const reversalLedger = await tx.eggLedgerEntry.create({
      data: {
        userId: sale.userId,
        entryType: "REVERSAL",
        eggUnits: sale.eggQuantity, // positive
        description: `Reversal of egg sale ${sale.publicReference}: ${reason}`,
        sourceType: "REVERSAL",
        sourceId: sale.id,
        reversedEntryId: sale.eggLedgerEntryId,
        idempotencyKey: `egg-market-sale-reversal:${sale.id}:${randomUUID()}`,
        metadata: {
          saleId: sale.id,
          publicReference: sale.publicReference,
          reversalReason: reason,
          reversedByUserId: actor.id,
        },
      },
    });

    // 2. Update sale record status
    const updatedSale = await tx.eggMarketSale.update({
      where: { id: sale.id },
      data: {
        status: "REVERSED",
        reversedAt: new Date(),
        reversedByUserId: actor.id,
        reversalReason: reason,
        reversalEggLedgerEntryId: reversalLedger.id,
      },
    });

    // 3. Decrement market purchased count
    await tx.eggMarket.update({
      where: { id: sale.marketId },
      data: {
        totalEggsPurchased: { decrement: sale.eggQuantity },
      },
    });

    // 4. Audit Log
    await createAuditLog(
      {
        actorUserId: actor.id,
        action: "EGG_MARKET_SALE_REVERSED",
        entityType: "EggMarketSale",
        entityId: sale.id,
        metadata: {
          publicReference: sale.publicReference,
          userId: sale.userId,
          eggQuantity: sale.eggQuantity,
          reason,
        },
      },
      tx,
    );

    return updatedSale;
  });
}

