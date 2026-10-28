import fs from "node:fs";

async function checkPaybost() {
  const res = await fetch("https://www.paybost.com/", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
  });
  const html = await res.text();
  console.log("PayBost full length:", html.length);
  const logoMatches = [...html.matchAll(/(https?:\/\/[^"'\s]+\.(?:png|svg|webp|jpg))/gi)].map(m => m[1]);
  console.log("PayBost all image URLs:", [...new Set(logoMatches)]);
}
checkPaybost();
