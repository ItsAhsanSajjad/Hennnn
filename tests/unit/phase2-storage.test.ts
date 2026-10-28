import { describe, expect, it } from "vitest";

import {
  inspectPaymentProofImage,
  resolvePrivateStorageKey,
} from "@/server/services/private-storage";
import { normalizeTransactionReference, safeFileName } from "@/lib/utilities/phase2";

const png1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

describe("Phase 2 storage utilities", () => {
  it("detects actual PNG bytes and dimensions", () => {
    expect(inspectPaymentProofImage(png1x1)).toMatchObject({
      mimeType: "image/png",
      extension: ".png",
      width: 1,
      height: 1,
    });
  });

  it("rejects hostile text bytes even when a caller claims an image name or type", () => {
    expect(() => inspectPaymentProofImage(Buffer.from("<script>alert(1)</script>"))).toThrow(
      "Payment proof bytes are not a supported image.",
    );
  });

  it("sanitizes risky file names", () => {
    expect(safeFileName("../../receipt.jpg.exe")).toBe("..-..-receipt.jpg.exe");
    expect(safeFileName("")).toBe("payment-proof");
  });

  it("keeps storage keys inside the private storage root", () => {
    expect(() => resolvePrivateStorageKey("../outside.png")).toThrow("Invalid storage key.");
    expect(() => resolvePrivateStorageKey("payment-proofs/../../outside.png")).toThrow(
      "Invalid storage key.",
    );
  });

  it("normalizes transaction references predictably", () => {
    expect(normalizeTransactionReference(" abc  123 ")).toBe("ABC123");
  });
});
