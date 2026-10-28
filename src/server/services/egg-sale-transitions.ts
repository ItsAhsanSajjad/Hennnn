import type { EggSaleStatus } from "@prisma/client";

type OperationalEggSaleStatus =
  "AWAITING_REVIEW" | "UNDER_REVIEW" | "PAYMENT_PROCESSING" | "PAID" | "REJECTED" | "CANCELLED";

const transitions: Record<OperationalEggSaleStatus, readonly OperationalEggSaleStatus[]> = {
  AWAITING_REVIEW: ["UNDER_REVIEW", "REJECTED", "CANCELLED"],
  UNDER_REVIEW: ["PAYMENT_PROCESSING", "REJECTED"],
  PAYMENT_PROCESSING: ["PAID"],
  PAID: [],
  REJECTED: [],
  CANCELLED: [],
};

export const openEggSaleStatuses: EggSaleStatus[] = [
  "AWAITING_REVIEW",
  "UNDER_REVIEW",
  "PAYMENT_PROCESSING",
];

export function assertEggSaleTransition({ from, to }: { from: EggSaleStatus; to: EggSaleStatus }) {
  const allowed = transitions[from as OperationalEggSaleStatus];
  if (!allowed?.includes(to as OperationalEggSaleStatus)) {
    throw new Error(`Egg-sale request cannot move from ${from} to ${to}.`);
  }
}
