async function main() {
  try {
    Object.assign(process.env, {
      NODE_ENV: process.env.NODE_ENV ?? "production",
      PRODUCT_MODE: process.env.PRODUCT_MODE ?? "PRODUCTION",
    });

    const [
      { parseServerEnv },
      { createRateLimitProvider },
      { createNotificationProvider },
      { createStorageProvider },
    ] = await Promise.all([
      import("../src/lib/env/server"),
      import("../src/server/providers/rate-limit"),
      import("../src/server/providers/notifications"),
      import("../src/server/providers/storage"),
    ]);

    const env = parseServerEnv(process.env);
    const rateLimit = createRateLimitProvider(env).validateReadiness();
    const notifications = createNotificationProvider(env).validateReadiness();
    const storage = createStorageProvider(env).validateReadiness();
    const failures = [rateLimit, notifications, storage].filter((result) => !result.ok);

    if (failures.length > 0) {
      for (const failure of failures) {
        console.error(`${failure.provider}: ${failure.reason ?? "not ready"}`);
      }
      process.exit(1);
    }

    console.log("Production environment configuration is structurally ready.");
  } catch (error) {
    console.error("Production environment validation failed.");
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

void main();
