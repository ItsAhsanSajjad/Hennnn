import { spawnSync } from "node:child_process";

const productMode = process.env.PRODUCT_MODE ?? "DEMO";
const confirmation = process.env.PAKHEN_CONFIRM_DOCKER_RESET;

if (productMode === "PRODUCTION") {
  console.error("Refusing to reset Docker volumes while PRODUCT_MODE=PRODUCTION.");
  process.exit(1);
}

if (confirmation !== "pakhen-dev-reset") {
  console.error(
    "Refusing to reset Docker volumes without PAKHEN_CONFIRM_DOCKER_RESET=pakhen-dev-reset.",
  );
  process.exit(1);
}

const result = spawnSync("docker", ["compose", "down", "--volumes", "--remove-orphans"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
