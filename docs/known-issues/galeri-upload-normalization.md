# Galeri Tamu — guest photo normalization must be fixed in prod

**Status: FIXED — deployed to prod in `ae2fb95` (build
`IzmHTm4U0_JRij460Bmei`, tag `release/prod/2026-11-23.ae2fb95`).**

## Symptom

A guest photo under the 1.75MB cap is still re-encoded and often stored at
~600KB. Example from staging: `1920×2635 / 1.73MB` framed JPEG →
`1530×2100 / ~616KB`.

## Root cause

- `src/lib/storage.ts` → `normalizeGuestPhoto()` always runs
  `sharp(...).resize(...).jpeg({ quality: 88, mozjpeg: true })` and checks the
  byte cap only **after** encoding. It never checks the input size/dimensions
  first.
- `src/lib/imageCompress.ts` → `compressImage()` also encodes every decodable
  image and only returns the original when the re-encode is not smaller.
- `src/components/gallery/PhotoboothCamera.tsx` captures at JPEG q0.88 and then
  runs `compressImage` again, so the real client path is already double-encoded
  before the server re-encodes a third time.
- The 2100px long-edge cap is applied regardless of file size; the example
  2635px-tall photo is resized even though it is under 1.75MB.

## Shipped fix

- `GUEST_PHOTO_MAX_DIMENSION` raised to **3000px** (byte cap stays 1.75MB).
- Server skips re-encoding when the input is JPEG/PNG/WebP, upright, ≤1.75MB,
  and ≤3000px long edge; the original uploads untouched. HEIC/HEIF and
  over-limit files still go through sharp.
- `compressImage()` returns the file unchanged when it already fits both
  budgets.
- Gallery capture + selfie paths use **q0.95** and a 3000px long edge. The
  generic editor path keeps its cheaper 2100px default.

## Fix details

1. **Server** (`normalizeGuestPhoto`): skip re-encoding when the input is
   JPEG/PNG/WebP, `≤ GUEST_PHOTO_MAX_BYTES` (1.75MB), and the long edge is
   `≤ GUEST_PHOTO_MAX_DIMENSION` (currently 2100px). Upload the original with
   its extension/content type. Keep conversion for HEIC/HEIF and for
   over-limit inputs.
2. **Client** (`compressImage`): return the file unchanged when it already fits
   both `maxBytes` and `maxDimension`; only encode when over either limit.
3. **Client capture** (`PhotoboothCamera.captureFromVideo` and the post-frame
   compress): raise `toBlob`/`initialQuality` from 0.88 to ~0.95 so photos that
   do not need compression stay sharp. Keep 1.75MB as the ceiling, not a target.
4. **Decide the dimension cap**: keep 2100px (safe, cheaper) or raise to
   ~3000px (larger/detail, more storage + egress and slower venue uploads). Do
   not change it silently.

## Verification before prod

- Upload a `1920×2635 / ~1.73MB` JPEG.
  - If the cap stays 2100px, expect only the dimension resize (no unnecessary
    q88 re-encode).
  - If the cap is raised to ≥2635px, expect the original to be stored
    byte-for-byte (same size and dimensions).
- Confirm stored files still render in the gallery, ZIP download, and Buku
  Kenangan.
- Re-run the staging load tests: larger stored files increase upload latency
  and storage/egress.
- Do not deploy until the release train carries this to prod; the staging build
  is not prod.

## Related

- The per-device upload rate limit (`gallery-upload:device:*` + per-IP ceiling)
  is also on `main`/staging and must ride the same release train to prod.
- Test evidence and scenario details: `docs/runbooks/galeri-tamu-stress-test.md`.
