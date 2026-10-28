import dotenv from "dotenv";
dotenv.config();

const SANDBOX_INITIATE_URL = "https://paybost.com/sandbox/payment/initiate";
const LIVE_INITIATE_URL = "https://paybost.com/payment/initiate";

async function testPaybost() {
  const publicKey = process.env.PAYBOST_PUBLIC_KEY;
  const secretKey = process.env.PAYBOST_SECRET_KEY;
  const isSandbox = process.env.PAYBOST_SANDBOX === "true";

  console.log("Testing PayBost Gateway Initiate...");
  console.log("PublicKey:", publicKey ? `${publicKey.slice(0, 8)}...` : "NONE");
  console.log("IsSandbox:", isSandbox);

  const identifier = "test_" + Date.now().toString(36).slice(-8);

  const form = new URLSearchParams({
    public_key: publicKey,
    identifier: identifier,
    currency: "PKR",
    amount: "500.00",
    details: "Test Order #123",
    ipn_url: "https://growmetaegg.digital/api/payment/gateway/ipn",
    site_logo: "https://growmetaegg.digital/brand/growmeta-egg-icon-192.png",
    success_url: "https://growmetaegg.digital/dashboard/orders/TEST?pay=success",
    cancel_url: "https://growmetaegg.digital/dashboard/orders/TEST?pay=cancel",
    checkout_theme: "dark",
    customer_name: "Test Customer",
    customer_email: "test@example.com",
  });

  console.log("\n--- Testing Sandbox Endpoint ---");
  try {
    const sandboxRes = await fetch(SANDBOX_INITIATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: form.toString(),
    });
    console.log("Sandbox HTTP Status:", sandboxRes.status);
    const sandboxText = await sandboxRes.text();
    console.log("Sandbox Raw Response:", sandboxText);
  } catch (err) {
    console.error("Sandbox Fetch Error:", err);
  }

  console.log("\n--- Testing Live Endpoint ---");
  try {
    const liveRes = await fetch(LIVE_INITIATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: form.toString(),
    });
    console.log("Live HTTP Status:", liveRes.status);
    const liveText = await liveRes.text();
    console.log("Live Raw Response:", liveText);
  } catch (err) {
    console.error("Live Fetch Error:", err);
  }
}

testPaybost();
