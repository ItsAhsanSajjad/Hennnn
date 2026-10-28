import fs from "node:fs";
import path from "node:path";

async function fetchSite(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
  });
  return await res.text();
}

async function inspect() {
  console.log("--- Inspecting PayBost ---");
  const pb = await fetchSite("https://www.paybost.com/");
  const pbMatches = [...pb.matchAll(/<img[^>]+>/gi)].map(m => m[0]);
  console.log("PayBost Images:", pbMatches.slice(0, 15));
  
  // Also check inline SVGs or links
  const pbSvgs = [...pb.matchAll(/<svg[^>]*>[\s\S]*?<\/svg>/gi)].map(m => m[0]);
  console.log("PayBost Inline SVGs count:", pbSvgs.length);
  if (pbSvgs.length > 0) {
    console.log("First SVG:", pbSvgs[0].slice(0, 300));
  }

  console.log("\n--- Inspecting Easypaisa ---");
  const ep = await fetchSite("https://easypaisa.com.pk/");
  const epMatches = [...ep.matchAll(/<img[^>]+>/gi)].map(m => m[0]);
  console.log("Easypaisa Images:", epMatches.slice(0, 15));
  const epSvgs = [...ep.matchAll(/<svg[^>]*>[\s\S]*?<\/svg>/gi)].map(m => m[0]);
  console.log("Easypaisa Inline SVGs count:", epSvgs.length);

  // Check custom logo in header or navbar
  const epHeader = ep.match(/<header[\s\S]*?<\/header>/i);
  if (epHeader) {
    console.log("Easypaisa Header HTML:", epHeader[0].slice(0, 800));
  }
}

inspect();
