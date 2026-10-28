import type { ServerEnv } from "@/lib/env/server";

export type StorageReadiness = {
  ok: boolean;
  provider: ServerEnv["STORAGE_PROVIDER"];
  reason?: string;
};

export interface StorageProvider {
  readonly name: ServerEnv["STORAGE_PROVIDER"];
  validateReadiness(): StorageReadiness;
}

class DisabledStorageProvider implements StorageProvider {
  readonly name = "disabled" as const;

  validateReadiness(): StorageReadiness {
    return { ok: true, provider: this.name };
  }
}

class LocalStorageProvider implements StorageProvider {
  readonly name = "local" as const;

  constructor(private readonly env: Pick<ServerEnv, "PRODUCT_MODE">) {}

  validateReadiness(): StorageReadiness {
    if (this.env.PRODUCT_MODE === "PRODUCTION") {
      return {
        ok: false,
        provider: this.name,
        reason: "Local filesystem storage is not production-safe for private payment proofs.",
      };
    }

    return { ok: true, provider: this.name };
  }
}

class S3StorageProvider implements StorageProvider {
  readonly name = "s3" as const;

  constructor(
    private readonly env: Pick<
      ServerEnv,
      "STORAGE_REGION" | "STORAGE_BUCKET" | "STORAGE_ACCESS_KEY" | "STORAGE_SECRET_KEY"
    >,
  ) {}

  validateReadiness(): StorageReadiness {
    if (
      !this.env.STORAGE_REGION ||
      !this.env.STORAGE_BUCKET ||
      !this.env.STORAGE_ACCESS_KEY ||
      !this.env.STORAGE_SECRET_KEY
    ) {
      return {
        ok: false,
        provider: this.name,
        reason: "S3-compatible storage credentials are incomplete.",
      };
    }

    return { ok: true, provider: this.name };
  }
}

export function createStorageProvider(env: ServerEnv): StorageProvider {
  if (env.STORAGE_PROVIDER === "s3") {
    return new S3StorageProvider(env);
  }

  if (env.STORAGE_PROVIDER === "local") {
    return new LocalStorageProvider(env);
  }

  return new DisabledStorageProvider();
}
