import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/database/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
  },
}));

describe("health and readiness endpoints", () => {
  it("returns minimal process health without environment details", async () => {
    const { GET } = await import("@/app/api/health/route");
    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, service: "pakhen" });
  });

  it("returns generic database readiness", async () => {
    const { GET } = await import("@/app/api/ready/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      service: "pakhen",
      dependencies: { database: "ok" },
    });
  });
});
