import { createHash, randomBytes } from "node:crypto";

export function createOrderReference() {
  return `PKH-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function normalizeTransactionReference(value: string) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

const generatedPaymentReferencePrefix = "PAYMENT-PROOF-";

export function createGeneratedPaymentReference() {
  return `${generatedPaymentReferencePrefix}${randomBytes(12).toString("hex").toUpperCase()}`;
}

export function isGeneratedPaymentReference(value: string) {
  return value.startsWith(generatedPaymentReferencePrefix);
}

export function displayPaymentReference(value: string) {
  return isGeneratedPaymentReference(value) ? "Not supplied" : value;
}

export function toUtcDate(value: Date | string = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date.");
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function toPktDate(value: Date | string = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date.");
  }
  // Pakistan Standard Time is UTC+5 (300 minutes)
  const pktMs = date.getTime() + 5 * 3600_000;
  const pktDate = new Date(pktMs);
  return new Date(Date.UTC(pktDate.getUTCFullYear(), pktDate.getUTCMonth(), pktDate.getUTCDate()));
}

export function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function sha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export function stableJsonHash(value: unknown) {
  return sha256(Buffer.from(JSON.stringify(value)));
}

export function safeFileName(name: string) {
  const base = name
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 120);
  return base || "payment-proof";
}
