import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";

import { env } from "@/lib/env/server";
import { safeFileName, sha256 } from "@/lib/utilities/phase2";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageDimension = 10_000;
const maxTargetDimension = 2400; // Optimal max dimension preserving sharp receipt text

export type StoredPrivateFile = {
  storageProvider: "local";
  storageKey: string;
  safeFileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string;
  imageWidth: number;
  imageHeight: number;
};

function storageRoot() {
  return path.resolve(process.cwd(), env.PRIVATE_STORAGE_DIR);
}

export function resolvePrivateStorageKey(storageKey: string) {
  const root = storageRoot();
  const fullPath = path.resolve(root, storageKey);
  const relative = path.relative(root, fullPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid storage key.");
  }
  return fullPath;
}

function readUint16(buffer: Buffer, offset: number) {
  return buffer.readUInt16BE(offset);
}

function readUint24LE(buffer: Buffer, offset: number) {
  return buffer[offset] + (buffer[offset + 1] << 8) + (buffer[offset + 2] << 16);
}

/**
 * Validate binary file magic numbers and inspect dimensions.
 */
export function inspectPaymentProofImage(buffer: Buffer) {
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    if (buffer.subarray(12, 16).toString("ascii") !== "IHDR" || width <= 0 || height <= 0) {
      throw new Error("Payment proof bytes are not a supported image.");
    }
    return { mimeType: "image/png", extension: ".png", width, height };
  }

  if (buffer.length >= 12 && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      const segmentLength = readUint16(buffer, offset + 2);
      if (segmentLength < 2 || offset + 2 + segmentLength > buffer.length) {
        break;
      }
      if (
        marker === 0xc0 ||
        marker === 0xc1 ||
        marker === 0xc2 ||
        marker === 0xc3 ||
        marker === 0xc5 ||
        marker === 0xc6 ||
        marker === 0xc7 ||
        marker === 0xc9 ||
        marker === 0xca ||
        marker === 0xcb ||
        marker === 0xcd ||
        marker === 0xce ||
        marker === 0xcf
      ) {
        const height = readUint16(buffer, offset + 5);
        const width = readUint16(buffer, offset + 7);
        if (width <= 0 || height <= 0) throw new Error("Payment proof bytes are not a supported image.");
        return { mimeType: "image/jpeg", extension: ".jpg", width, height };
      }
      offset += 2 + segmentLength;
    }
    return { mimeType: "image/jpeg", extension: ".jpg", width: 1000, height: 1000 };
  }

  if (
    buffer.length >= 30 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    const chunk = buffer.subarray(12, 16).toString("ascii");
    if (chunk === "VP8X" && buffer.length >= 30) {
      const width = readUint24LE(buffer, 24) + 1;
      const height = readUint24LE(buffer, 27) + 1;
      return { mimeType: "image/webp", extension: ".webp", width, height };
    }
    return { mimeType: "image/webp", extension: ".webp", width: 1000, height: 1000 };
  }

  throw new Error("Payment proof bytes are not a supported image.");
}

export async function inspectAndOptimizePaymentProof(buffer: Buffer) {
  // 1. Signature inspection
  inspectPaymentProofImage(buffer);

  // 2. Deep sharp decode & metadata inspection
  let metadata: Metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch {
    throw new Error("Screenshot must be a JPG, PNG, or WebP file smaller than 5 MB.");
  }

  if (!metadata.width || !metadata.height || metadata.width <= 0 || metadata.height <= 0) {
    throw new Error("Screenshot dimensions are invalid.");
  }

  if (metadata.format === "svg" || metadata.format === "pdf") {
    throw new Error("Screenshot must be a JPG, PNG, or WebP file smaller than 5 MB.");
  }

  if (metadata.width > maxImageDimension || metadata.height > maxImageDimension) {
    throw new Error("Screenshot dimensions are excessively large.");
  }

  // 3. High-fidelity optimization: resize if oversized and encode to crisp WebP
  let pipeline = sharp(buffer).rotate(); // auto-rotate based on EXIF

  if (metadata.width > maxTargetDimension || metadata.height > maxTargetDimension) {
    pipeline = pipeline.resize({
      width: maxTargetDimension,
      height: maxTargetDimension,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const optimizedBuffer = await pipeline
    .webp({
      quality: 88, // High fidelity for razor-sharp transaction ID text & bank details
      effort: 4,
    })
    .toBuffer();

  const finalMetadata = await sharp(optimizedBuffer).metadata();

  return {
    buffer: optimizedBuffer,
    mimeType: "image/webp",
    extension: ".webp",
    width: finalMetadata.width ?? metadata.width,
    height: finalMetadata.height ?? metadata.height,
  };
}

export async function storePaymentProofFile(file: File): Promise<StoredPrivateFile> {
  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("Screenshot must be a JPG, PNG, or WebP file smaller than 5 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length <= 0) {
    throw new Error("Screenshot must be a JPG, PNG, or WebP file smaller than 5 MB.");
  }
  if (buffer.length > env.PAYMENT_PROOF_MAX_BYTES) {
    throw new Error("Screenshot must be a JPG, PNG, or WebP file smaller than 5 MB.");
  }

  // Deep inspect and optimize
  const processed = await inspectAndOptimizePaymentProof(buffer);

  const safeName = safeFileName(file.name).replace(/\.[^.]+$/, "") + processed.extension;
  const storageKey = path
    .join("payment-proofs", `${randomUUID()}${processed.extension}`)
    .replaceAll("\\", "/");
  const fullPath = resolvePrivateStorageKey(storageKey);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, processed.buffer, { flag: "wx" });

  return {
    storageProvider: "local",
    storageKey,
    safeFileName: safeName,
    mimeType: processed.mimeType,
    sizeBytes: processed.buffer.length,
    sha256Hash: sha256(processed.buffer),
    imageWidth: processed.width,
    imageHeight: processed.height,
  };
}

export async function readPrivateFile(storageKey: string) {
  const fullPath = resolvePrivateStorageKey(storageKey);
  const [buffer, fileStat] = await Promise.all([readFile(fullPath), stat(fullPath)]);
  return { buffer, sizeBytes: fileStat.size };
}

export async function deletePrivateFile(storageKey: string) {
  await unlink(resolvePrivateStorageKey(storageKey)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}

