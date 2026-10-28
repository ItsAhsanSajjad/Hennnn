import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

import { env } from "@/lib/env/server";

// Neon's serverless driver tunnels Postgres over a WebSocket on port 443.
// Required on hosts that block outbound 5432 (e.g. shared cPanel/LiteSpeed),
// where the raw TCP pg driver times out with ETIMEDOUT.
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const databasePoolMax = env.DATABASE_POOL_MAX ?? (env.NODE_ENV === "production" ? 10 : 5);
const databaseUrl = new URL(env.DATABASE_URL);
const databaseSchema = databaseUrl.searchParams.get("schema") ?? "public";
const adapterOptions = { connectionString: env.DATABASE_URL, max: databasePoolMax };
const adapter = databaseUrl.hostname.endsWith(".neon.tech")
  ? new PrismaNeon(adapterOptions, { schema: databaseSchema })
  : new PrismaPg(adapterOptions, { schema: databaseSchema });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
