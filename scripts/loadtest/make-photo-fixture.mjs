#!/usr/bin/env node
// Membuat foto JPEG dummy untuk load test (butuh sharp yang sudah ada di repo).
// Contoh:
// node scripts/loadtest/make-photo-fixture.mjs --out scripts/loadtest/fixtures/photo-1750kb.jpg --width 2400 --height 3200 --target-bytes 1835008

import fs from "node:fs/promises";
import path from "node:path";

const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) continue;
  const raw = a.slice(2);
  if (raw.includes("=")) {
    const [k, ...rest] = raw.split("=");
    args[k] = rest.join("=");
  } else if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
    args[raw] = argv[++i];
  } else {
    args[raw] = "true";
  }
}

const out = args.out || "scripts/loadtest/fixtures/photo-1750kb.jpg";
const width = Number(args.width || 2400);
const height = Number(args.height || 3200);
const targetBytes = Number(args["target-bytes"] || 1835008);

const { default: sharp } = await import("sharp");

// Buat gambar noisy agar kompresi JPEG realistis (bukan flat color).
const raw = Buffer.alloc(width * height * 3);
for (let i = 0; i < raw.length; i++) raw[i] = Math.floor(Math.random() * 256);

let quality = 92;
let buf = null;
for (let i = 0; i < 12; i++) {
  buf = await sharp(raw, { raw: { width, height, channels: 3 } })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
  if (buf.length <= targetBytes * 1.05 && buf.length >= targetBytes * 0.9) break;
  if (buf.length > targetBytes) quality = Math.max(55, quality - 4);
  else quality = Math.min(95, quality + 2);
}

await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, buf);
console.log(JSON.stringify({ out, width, height, targetBytes, actualBytes: buf.length, quality }));
