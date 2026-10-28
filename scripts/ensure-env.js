const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const envFile = path.join(projectRoot, ".env");
const exampleFile = path.join(projectRoot, ".env.example");

// 1. Ensure .env exists
if (!fs.existsSync(envFile)) {
  if (fs.existsSync(exampleFile)) {
    try {
      fs.copyFileSync(exampleFile, envFile);
      console.log("✅ [Setup] Automatically created .env from .env.example");
    } catch (err) {
      console.error("❌ [Setup] Failed to copy .env.example to .env:", err.message);
    }
  } else {
    console.warn("⚠️ [Setup] Neither .env nor .env.example was found in project root.");
  }
} else {
  console.log("ℹ️ [Setup] .env file detected.");
}
