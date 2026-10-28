import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";

dotenv.config();
neonConfig.webSocketConstructor = ws;

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

function buildCustomerEmail(user) {
  if (user.email && user.email.includes("@") && user.email.length <= 30) {
    return user.email;
  }
  const cleanUser = user.usernameNormalized.replace(/[^a-z0-9]/gi, "").slice(0, 16) || "user";
  return `${cleanUser}@gme.pk`;
}

async function testFlow() {
  console.log("=== Testing Order + PayBost Initiation Flow ===");
  const user = await prisma.user.findFirst({ where: { usernameNormalized: "demo_user" } });
  if (!user) throw new Error("demo_user not found");

  const plan = await prisma.henPlan.findFirst({ where: { status: "ACTIVE", isActive: true } });
  if (!plan) throw new Error("Active plan not found");

  console.log("User:", user.username, "ID:", user.id);
  console.log("Plan:", plan.name, "Price:", plan.pricePaisa.toString());

  const order = await prisma.purchaseOrder.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const { initiatePaybostPayment, newGatewayIdentifier, paisaToAmountString, getPaybostConfig } = await import("../src/server/services/paybost.ts");
  const identifier = newGatewayIdentifier();
  const base = "https://growmetaegg.digital";
  const { siteLogoUrl } = getPaybostConfig();
  const returnBase = `${base}/dashboard/orders/${order.orderReference}`;
  const customerEmail = buildCustomerEmail(user);

  console.log("Initiating with identifier:", identifier, "amount:", paisaToAmountString(order.totalAmountPaisa));
  console.log("Customer Email:", customerEmail, `(Length: ${customerEmail.length})`);

  const result = await initiatePaybostPayment({
    amount: paisaToAmountString(order.totalAmountPaisa),
    identifier,
    currency: "PKR",
    details: `Order ${order.orderReference} - ${order.planNameSnapshot}`.slice(0, 100),
    ipnUrl: `${base}/api/payment/gateway/ipn`,
    siteLogo: siteLogoUrl || `${base}/brand/growmeta-egg-icon-192.png`,
    successUrl: `${returnBase}?pay=success`,
    cancelUrl: `${returnBase}?pay=cancel`,
    checkoutTheme: "dark",
    customerName: user.username.slice(0, 30),
    customerEmail,
  });

  console.log("Initiate Result:", result);
}

testFlow().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
