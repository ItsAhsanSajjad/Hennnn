import fs from "node:fs";
import path from "node:path";

const targetDir = path.join(process.cwd(), "public", "assets", "payment-methods");
fs.mkdirSync(targetDir, { recursive: true });

async function downloadFile(url, filename) {
  console.log(`Downloading ${url} -> ${filename}...`);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });
  if (!res.ok) throw new Error(`Failed to download ${url}: status ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const outPath = path.join(targetDir, filename);
  fs.writeFileSync(outPath, buffer);
  console.log(`Saved ${filename} (${buffer.length} bytes)`);
  return buffer;
}

async function main() {
  console.log("=== Downloading Official Payment Method Logos ===");

  // 1. Easypaisa from https://easypaisa.com.pk/
  try {
    await downloadFile(
      "https://easypaisa.com.pk/wp-content/uploads/2026/01/cropped-cropped-easypaisa-logo-dark-1.png",
      "easypaisa-logo.png"
    );
  } catch (e) {
    console.error("Easypaisa error:", e.message);
  }

  // 2. JazzCash from https://www.jazzcash.com.pk/
  try {
    const jcSvg = await downloadFile(
      "https://www.jazzcash.com.pk/assets/svgs/JazzCash-logo-hd-80.svg",
      "jazzcash-logo.svg"
    );
    // Sanitize SVG
    let svgContent = jcSvg.toString("utf8");
    svgContent = svgContent.replace(/<script[\s\S]*?<\/script>/gi, "");
    fs.writeFileSync(path.join(targetDir, "jazzcash-logo.svg"), svgContent, "utf8");

    await downloadFile(
      "https://www.jazzcash.com.pk/assets/images/jazzcash-logo.png",
      "jazzcash-logo.png"
    );
  } catch (e) {
    console.error("JazzCash error:", e.message);
  }

  // 3. PayBost from https://www.paybost.com/
  try {
    await downloadFile(
      "https://www.paybost.com/assets/images/logo_icon/logo.png",
      "paybost-logo.png"
    );
  } catch (e) {
    console.error("PayBost error:", e.message);
  }

  // 4. Custom Bank Transfer SVG with GrowMeta Navy & Copper theme
  const bankTransferSvg = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gmeBankNavy" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#10222D" />
      <stop offset="100%" stopColor="#061A2B" />
    </linearGradient>
    <linearGradient id="gmeBankCopper" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#F59B52" />
      <stop offset="100%" stopColor="#D8793F" />
    </linearGradient>
  </defs>
  
  <!-- Subtle circular transfer halo -->
  <circle cx="32" cy="32" r="28" stroke="url(#gmeBankCopper)" stroke-opacity="0.15" stroke-width="2" stroke-dasharray="4 4" />
  
  <!-- Bank Pediment / Roof -->
  <path d="M32 12 L14 21 L50 21 Z" fill="url(#gmeBankNavy)" />
  <path d="M32 12 L14 21 L50 21 Z" stroke="url(#gmeBankCopper)" stroke-width="2" stroke-linejoin="round" />
  
  <!-- Architrave Beam -->
  <rect x="13" y="21" width="38" height="3.5" rx="1" fill="url(#gmeBankCopper)" />
  
  <!-- Classical Pillars -->
  <rect x="17" y="26" width="4.5" height="17" rx="1" fill="url(#gmeBankNavy)" />
  <rect x="25.5" y="26" width="4.5" height="17" rx="1" fill="url(#gmeBankNavy)" />
  <rect x="34" y="26" width="4.5" height="17" rx="1" fill="url(#gmeBankNavy)" />
  <rect x="42.5" y="26" width="4.5" height="17" rx="1" fill="url(#gmeBankNavy)" />
  
  <!-- Stepped Podium / Foundation -->
  <rect x="13" y="44" width="38" height="3" rx="1" fill="url(#gmeBankCopper)" />
  <rect x="10" y="48" width="44" height="4" rx="1.5" fill="url(#gmeBankNavy)" />
  
  <!-- Subtle Transfer Arrow Badge (Bottom Right Accent) -->
  <g transform="translate(37, 33)">
    <circle cx="11" cy="11" r="10" fill="#FFF8EC" stroke="url(#gmeBankCopper)" stroke-width="1.8" />
    <path d="M7 10 L15 10 M12 7 L15 10 L12 13" stroke="#8C3A14" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M15 12 L7 12 M10 15 L7 12 L10 9" stroke="#D8793F" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  </g>
</svg>`;

  fs.writeFileSync(path.join(targetDir, "bank-transfer-icon.svg"), bankTransferSvg, "utf8");
  console.log("Saved bank-transfer-icon.svg");
  console.log("=== All Payment Assets Ready in public/assets/payment-methods/ ===");
}

main();
