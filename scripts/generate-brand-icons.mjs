import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(path.join(projectRoot, "public", "logo.png"));

const pngTargets = [
  ["public/favicon-16x16.png", 16],
  ["public/favicon-32x32.png", 32],
  ["public/android-chrome-192x192.png", 192],
  ["public/android-chrome-512x512.png", 512],
  ["src/app/apple-icon.png", 180],
];

await Promise.all(
  pngTargets.map(async ([relativePath, size]) => {
    await sharp(source)
      .resize(size, size)
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(path.join(projectRoot, relativePath));
  }),
);

const icoSizes = [16, 32, 48];
const icoImages = await Promise.all(
  icoSizes.map((size) =>
    sharp(source)
      .resize(size, size)
      .ensureAlpha()
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer(),
  ),
);

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoImages.length, 4);

let imageOffset = header.length + icoImages.length * 16;
const entries = icoImages.map((image, index) => {
  const size = icoSizes[index];
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size === 256 ? 0 : size, 0);
  entry.writeUInt8(size === 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(image.length, 8);
  entry.writeUInt32LE(imageOffset, 12);
  imageOffset += image.length;
  return entry;
});

await writeFile(
  path.join(projectRoot, "src", "app", "favicon.ico"),
  Buffer.concat([header, ...entries, ...icoImages]),
);

console.log("Generated NexoraPro favicon, Apple touch icon, and PWA icons.");
