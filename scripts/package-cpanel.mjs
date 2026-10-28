import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const rootDir = process.cwd();
const tempPackageDir = path.join(rootDir, "tmp-cpanel-package");
const outputZip = path.join(rootDir, "pakhen-cpanel.zip");

console.log("Preparing fresh cPanel production package...");

// Remove existing temp dir if present
if (fs.existsSync(tempPackageDir)) {
  fs.rmSync(tempPackageDir, { recursive: true, force: true });
}
fs.mkdirSync(tempPackageDir, { recursive: true });

// List of directories and files to include
const includeItems = [
  "package.json",
  "pnpm-lock.yaml",
  "server.js",
  "next.config.ts",
  "tsconfig.json",
  "postcss.config.mjs",
  "eslint.config.mjs",
  "prisma.config.ts",
  "DEPLOY-CPANEL.md",
  ".env.example",
  "test-neon.cjs",
  "src",
  "prisma",
  "public",
  "assets",
  "scripts",
];

for (const item of includeItems) {
  const srcPath = path.join(rootDir, item);
  const destPath = path.join(tempPackageDir, item);
  if (fs.existsSync(srcPath)) {
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      fs.cpSync(srcPath, destPath, {
        recursive: true,
        filter: (src) => {
          const base = path.basename(src);
          if (
            base === ".git" ||
            base === "node_modules" ||
            base === ".next" ||
            base === ".env" ||
            base.endsWith(".log") ||
            base.startsWith("screenshot-") ||
            base === ".private-storage" ||
            base === "tmp"
          ) {
            return false;
          }
          return true;
        },
      });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
    console.log(`Copied: ${item}`);
  }
}

// Ensure no secret .env or logs crept in
const checkEnv = path.join(tempPackageDir, ".env");
if (fs.existsSync(checkEnv)) {
  fs.unlinkSync(checkEnv);
}

// Compress using PowerShell Compress-Archive
console.log("Creating zip archive...");
const psCommand = `Compress-Archive -Path "${tempPackageDir}\\*" -DestinationPath "${outputZip}" -Force`;
execSync(`powershell -Command "${psCommand}"`, { stdio: "inherit" });

// Clean up temp dir
fs.rmSync(tempPackageDir, { recursive: true, force: true });

const zipStat = fs.statSync(outputZip);
console.log(`Successfully created: ${outputZip} (${(zipStat.size / (1024 * 1024)).toFixed(2)} MB)`);
