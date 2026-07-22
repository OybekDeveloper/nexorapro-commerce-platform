import "server-only";

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { HttpError } from "@/server/http";

export const MAX_PRODUCT_UPLOAD_BYTES = 8 * 1024 * 1024;

const uploadRoot = process.env.UPLOAD_DIR || "/tmp/nexorapro-uploads";
if (!path.isAbsolute(uploadRoot)) throw new Error("UPLOAD_DIR mutlaq (absolute) path bo‘lishi kerak");

const signatures = [
  { mime: "image/jpeg", extension: "jpg", matches: (buffer: Buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  { mime: "image/png", extension: "png", matches: (buffer: Buffer) => buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: "image/webp", extension: "webp", matches: (buffer: Buffer) => buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP" },
  { mime: "image/avif", extension: "avif", matches: (buffer: Buffer) => buffer.subarray(4, 12).toString("ascii").includes("ftypavif") || buffer.subarray(4, 12).toString("ascii").includes("ftypavis") },
] as const;

function detectImage(buffer: Buffer) {
  return signatures.find((signature) => signature.matches(buffer));
}

function monthFolder(date = new Date()) {
  return [String(date.getUTCFullYear()), String(date.getUTCMonth() + 1).padStart(2, "0")];
}

export async function saveProductImage(file: File) {
  if (file.size <= 0) throw new HttpError(422, "Rasm fayli bo‘sh", "VALIDATION_ERROR");
  if (file.size > MAX_PRODUCT_UPLOAD_BYTES) {
    throw new HttpError(413, "Rasm hajmi 8 MB dan oshmasligi kerak");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectImage(buffer);
  if (!detected) {
    throw new HttpError(415, "Faqat JPEG, PNG, WebP yoki AVIF rasm yuklash mumkin");
  }

  const parts = monthFolder();
  const directory = path.join(/*turbopackIgnore: true*/ uploadRoot, "products", ...parts);
  await fs.promises.mkdir(directory, { recursive: true, mode: 0o750 });
  const filename = `${randomUUID()}.${detected.extension}`;
  const destination = path.join(/*turbopackIgnore: true*/ directory, filename);
  await fs.promises.writeFile(destination, buffer, { flag: "wx", mode: 0o640 });
  return {
    url: `/uploads/products/${parts.join("/")}/${filename}`,
    mimeType: detected.mime,
    sizeBytes: buffer.byteLength,
  };
}
