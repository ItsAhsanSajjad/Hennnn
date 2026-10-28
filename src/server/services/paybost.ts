import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env/server";
import { getPaymentMethodSettings } from "@/server/services/payment-methods";

/**
 * Paybost / PayPak gateway helper. Server-only: the secret key never leaves this
 * module and is never sent to the client. All authenticity is proven by the
 * HMAC-SHA256 IPN signature.
 */

const LIVE_INITIATE_URL = "https://paybost.com/payment/initiate";
const SANDBOX_INITIATE_URL = "https://paybost.com/sandbox/payment/initiate";

export function getPaybostConfig() {
  return {
    publicKey: env.PAYBOST_PUBLIC_KEY ?? "",
    secretKey: env.PAYBOST_SECRET_KEY ?? "",
    sandbox: env.PAYBOST_SANDBOX,
    siteLogoUrl: env.PAYBOST_SITE_LOGO_URL ?? "",
  };
}

/** Keys are present in the environment. */
export function isPaybostConfigured() {
  const { publicKey, secretKey } = getPaybostConfig();
  return publicKey.length > 0 && secretKey.length > 0;
}

/** Keys present AND the admin toggle is on. */
export async function isPaybostEnabled() {
  if (!isPaybostConfigured()) return false;
  const settings = await getPaymentMethodSettings();
  return settings.paybostEnabled;
}

/** Absolute public base URL for building ipn/return URLs. Prefers incoming request origin. */
export function appBaseUrl(request?: Request) {
  if (request) {
    try {
      const url = new URL(request.url);
      const proto =
        request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "") || "http";
      const host =
        request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
      if (host) {
        return `${proto}://${host}`.replace(/\/+$/, "");
      }
      if (url.origin && url.origin !== "null") {
        return url.origin.replace(/\/+$/, "");
      }
    } catch {
      // fall through
    }
  }
  const configured = env.APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return "http://localhost:3000";
}

/**
 * Random identifier for a payment, unique and <= 20 chars (Paybost limit).
 * A UUID/cuid would be too long, so we use 18 hex chars. The database unique
 * constraint on gatewayIdentifier is the final guarantee of uniqueness.
 */
export function newGatewayIdentifier() {
  return randomBytes(9).toString("hex");
}

/**
 * Signature = UPPERCASE( HMAC_SHA256( amount CONCAT identifier , SECRET_KEY ) ).
 * Computed over the RAW amount string exactly as received on the wire.
 */
export function computeIpnSignature(rawAmount: string, identifier: string, secretKey: string) {
  return createHmac("sha256", secretKey)
    .update(`${rawAmount}${identifier}`)
    .digest("hex")
    .toUpperCase();
}

/** Constant-time comparison of the received signature against the expected one. */
export function verifyIpnSignature({
  rawAmount,
  identifier,
  signature,
  secretKey,
}: {
  rawAmount: string;
  identifier: string;
  signature: string;
  secretKey: string;
}) {
  if (!secretKey || !signature) return false;
  const expected = computeIpnSignature(rawAmount, identifier, secretKey);
  const provided = signature.trim().toUpperCase();
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(provided, "utf8");
  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

/** Exact paisa (BigInt) -> gateway amount string in major units, e.g. 125000n -> "1250.00". */
export function paisaToAmountString(paisa: bigint) {
  const negative = paisa < 0n;
  const abs = negative ? -paisa : paisa;
  const rupees = abs / 100n;
  const paise = abs % 100n;
  return `${negative ? "-" : ""}${rupees.toString()}.${paise.toString().padStart(2, "0")}`;
}

/** Parse a wire amount string ("1250" or "1250.5" or "1250.50") into exact paisa. */
export function amountStringToPaisa(raw: string): bigint | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;
  const rupees = BigInt(match[1]);
  const paise = BigInt((match[2] ?? "").padEnd(2, "0"));
  return rupees * 100n + paise;
}

type InitiateParams = {
  amount: string;
  identifier: string;
  currency: string;
  details: string;
  ipnUrl: string;
  siteLogo: string;
  successUrl: string;
  cancelUrl: string;
  checkoutTheme: "light" | "dark";
  customerName: string;
  customerEmail: string;
};

type InitiateResult = { ok: true; url: string } | { ok: false; error: string };

/** POST the initiate form (x-www-form-urlencoded) and normalise the varied replies. */
export async function initiatePaybostPayment(params: InitiateParams): Promise<InitiateResult> {
  const { publicKey, secretKey, sandbox } = getPaybostConfig();
  if (!publicKey || !secretKey) {
    return { ok: false, error: "Online payment is not configured." };
  }

  const endpoint = sandbox ? SANDBOX_INITIATE_URL : LIVE_INITIATE_URL;
  const form = new URLSearchParams({
    public_key: publicKey,
    identifier: params.identifier,
    currency: params.currency,
    amount: params.amount,
    details: params.details.slice(0, 100),
    ipn_url: params.ipnUrl,
    site_logo: params.siteLogo,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    checkout_theme: params.checkoutTheme,
    customer_name: params.customerName,
    customer_email: params.customerEmail,
  });

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: form.toString(),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "Could not reach the payment gateway. Try again." };
  }

  const rawText = await response.text();
  const text = rawText.trim();
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return { ok: false, error: "The payment gateway returned an unexpected response." };
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    // Success: { "success": "ok", "url": "<hosted checkout url>" }
    if (record.success === "ok" && typeof record.url === "string" && record.url.length > 0) {
      return { ok: true, url: record.url };
    }
    // Error variants: { error: "true", message } or { error: "yes", errors: [...] } or { errors: { email: [...] } }
    if (typeof record.message === "string" && record.message.length > 0) {
      return { ok: false, error: record.message };
    }
    if (Array.isArray(record.errors) && record.errors.length > 0) {
      return { ok: false, error: record.errors.map((item) => String(item)).join(" ") };
    }
    if (record.errors && typeof record.errors === "object") {
      const errorStrings = Object.values(record.errors as Record<string, unknown>)
        .flat()
        .map((item) => String(item));
      if (errorStrings.length > 0) {
        return { ok: false, error: errorStrings.join(" ") };
      }
    }
  }

  return { ok: false, error: "The payment gateway rejected the request." };
}
