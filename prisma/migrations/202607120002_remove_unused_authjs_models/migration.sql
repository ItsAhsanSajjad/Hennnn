-- Remove adapter-only Auth.js tables after the audit confirmed Auth.js is not the active auth runtime.
DROP TABLE IF EXISTS "Authenticator";
DROP TABLE IF EXISTS "VerificationToken";
DROP TABLE IF EXISTS "Account";

