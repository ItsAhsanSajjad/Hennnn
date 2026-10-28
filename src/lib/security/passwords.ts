import { randomBytes } from "node:crypto";

import { argon2id, argon2Verify } from "hash-wasm";

// Pure-WASM argon2id (hash-wasm) — no native binary, so it works on hosts with
// an older glibc where the native `argon2` prebuild fails to load (ERR_DLOPEN_FAILED).
// Output is the standard argon2 PHC string, so hashes remain compatible both ways.
export async function hashPassword(password: string) {
  return argon2id({
    password,
    salt: randomBytes(16),
    parallelism: 1,
    iterations: 2,
    memorySize: 19_456,
    hashLength: 32,
    outputType: "encoded",
  });
}

export async function verifyPassword(hash: string, password: string) {
  try {
    return await argon2Verify({ password, hash });
  } catch {
    return false;
  }
}
