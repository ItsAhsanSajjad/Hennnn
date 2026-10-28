/**
 * Quick-access one-tap sign-in storage (client-side).
 *
 * Persists a returning user's account credential in localStorage so they can sign
 * in with a single tap. localStorage survives browser and device restarts, so the
 * quick-access button reappears next visit without any server round-trip.
 *
 * SECURITY: the secret is only base64-obfuscated (NOT encrypted). This is a
 * convenience feature for a demo on a trusted personal device — it is not safe on
 * shared/public computers. Callers gate it behind explicit user intent (the
 * "remember this account" choice / creating an account).
 */

export const MAX_QUICK_ACCOUNTS = 6;

export type Portal = "customer" | "admin";
export type QuickAccount = { id: string; secret: string };

export function quickAccessStorageKey(portal: Portal): string {
  return `pakhen.quick-access.${portal}.v2`;
}

function legacyStorageKey(portal: Portal): string {
  return `pakhen.quick-access.${portal}.v1`;
}

export function encodeSecret(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function decodeSecret(value: string): string {
  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

function isQuickAccount(entry: unknown): entry is QuickAccount {
  return (
    typeof entry === "object" &&
    entry !== null &&
    typeof (entry as QuickAccount).id === "string" &&
    typeof (entry as QuickAccount).secret === "string" &&
    (entry as QuickAccount).id.length > 0 &&
    (entry as QuickAccount).id.length <= 80
  );
}

export function readQuickAccounts(portal: Portal): QuickAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw: unknown = JSON.parse(
      window.localStorage.getItem(quickAccessStorageKey(portal)) ?? "[]",
    );
    return Array.isArray(raw) ? raw.filter(isQuickAccount).slice(0, MAX_QUICK_ACCOUNTS) : [];
  } catch {
    return [];
  }
}

/** Upsert an account to the front of the quick-access list (most recent first). */
export function saveQuickAccount(portal: Portal, id: string, password: string): void {
  if (typeof window === "undefined") return;
  const trimmed = id.trim();
  if (!trimmed || !password) return;
  try {
    const entry: QuickAccount = { id: trimmed, secret: encodeSecret(password) };
    const next = [entry, ...readQuickAccounts(portal).filter((a) => a.id !== trimmed)].slice(
      0,
      MAX_QUICK_ACCOUNTS,
    );
    window.localStorage.setItem(quickAccessStorageKey(portal), JSON.stringify(next));
  } catch {
    // Ignore storage failures (private mode, quota exceeded).
  }
}

/** Remove one account and return the updated list. */
export function removeQuickAccount(portal: Portal, id: string): QuickAccount[] {
  const next = readQuickAccounts(portal).filter((a) => a.id !== id);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(quickAccessStorageKey(portal), JSON.stringify(next));
    } catch {
      // Ignore storage failures.
    }
  }
  return next;
}

/** Drop the old username-only format that cannot power a one-tap sign-in. */
export function clearLegacyQuickAccounts(portal: Portal): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(legacyStorageKey(portal));
  } catch {
    // Ignore.
  }
}

/**
 * Offer the credential to the browser's native password manager. Best effort:
 * unsupported browsers simply rely on the save prompt from the navigation that
 * follows a successful sign-in.
 */
export async function storePasswordCredential(id: string, password: string): Promise<void> {
  try {
    const PasswordCredentialCtor = (
      window as unknown as {
        PasswordCredential?: new (data: {
          id: string;
          password: string;
          name?: string;
        }) => Credential;
      }
    ).PasswordCredential;
    const value = id.trim();
    if (PasswordCredentialCtor && navigator.credentials?.store && value && password) {
      await navigator.credentials.store(
        new PasswordCredentialCtor({ id: value, password, name: value }),
      );
    }
  } catch {
    // Best effort.
  }
}
