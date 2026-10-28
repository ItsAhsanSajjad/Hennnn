-- Add a read-only console role for reporting and audit access.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'VIEWER';
