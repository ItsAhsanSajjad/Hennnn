import { describe, expect, it } from "vitest";

import { formatPaisa } from "@/lib/utilities/format";

describe("format utilities", () => {
  it("formats paisa as PKR without floating-point storage", () => {
    expect(formatPaisa(123_456)).toContain("1,234.56");
    expect(formatPaisa(BigInt(500_000))).toContain("5,000");
  });
});
