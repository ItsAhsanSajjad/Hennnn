import { headers } from "next/headers";

export async function getRequestMeta() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || undefined,
    userAgent: headerStore.get("user-agent") || undefined,
  };
}
