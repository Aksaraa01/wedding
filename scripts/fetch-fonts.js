// Downloads static latin woff2 files for the app's Google Fonts set.
// Mirrors the weights/styles declared in src/app/layout.tsx.
// Writes into public/fonts/. Manual fetch is reliable; the Turbopack
// burst-fetch of the same files flakes, so we vendor them instead.
const fs = require("fs");
const path = require("path");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const OUT = path.join(__dirname, "..", "public", "fonts");

const FAMILIES = [
  { name: "Inter", weights: ["300", "400", "500", "600", "700", "800"], styles: ["normal"] },
  { name: "Playfair Display", weights: ["400", "500", "600", "700"], styles: ["normal", "italic"] },
  { name: "Cormorant Garamond", weights: ["400", "500", "600", "700"], styles: ["normal", "italic"] },
  { name: "Dancing Script", weights: ["500", "600", "700"], styles: ["normal"] },
  { name: "Plus Jakarta Sans", weights: ["300", "400", "500", "600", "700", "800"], styles: ["normal"] },
  { name: "EB Garamond", weights: ["400", "500", "600", "700"], styles: ["normal", "italic"] },
  { name: "Italianno", weights: ["400"], styles: ["normal"] },
  { name: "Press Start 2P", weights: ["400"], styles: ["normal"] },
  { name: "Alex Brush", weights: ["400"], styles: ["normal"] },
  { name: "Montserrat", weights: ["300", "400", "500", "600", "700", "800"], styles: ["normal"] },
  { name: "Cinzel", weights: ["400", "600"], styles: ["normal"] },
  { name: "Pinyon Script", weights: ["400"], styles: ["normal"] },
  { name: "Public Sans", weights: ["300", "400", "500", "600", "700"], styles: ["normal"] },
  { name: "Baskervville", weights: ["400"], styles: ["normal"] },
  { name: "Jura", weights: ["300", "400", "500", "600", "700"], styles: ["normal"] },
  { name: "Lora", weights: ["400", "500", "600", "700"], styles: ["normal", "italic"] },
  { name: "Poppins", weights: ["300", "400", "500", "600", "700"], styles: ["normal"] },
  { name: "Mulish", weights: ["300", "400", "500", "600", "700"], styles: ["normal", "italic"] },
  { name: "WindSong", weights: ["400"], styles: ["normal"] },
  { name: "Cormorant", weights: ["300", "400", "500", "600"], styles: ["normal", "italic"] },
  { name: "Bitter", weights: ["300", "400", "500"], styles: ["normal", "italic"] },
  { name: "Allura", weights: ["400"], styles: ["normal"] },
  { name: "Parisienne", weights: ["400"], styles: ["normal"] },
  { name: "Caveat", weights: ["400", "500", "600", "700"], styles: ["normal"] },
  { name: "Knewave", weights: ["400"], styles: ["normal"] },
  { name: "DM Sans", weights: ["300", "400", "500", "600", "700"], styles: ["normal"] },
  { name: "DM Serif Display", weights: ["400"], styles: ["normal", "italic"] },
];

function cssUrl(f) {
  const fam = `family=${encodeURIComponent(f.name)}:ital,wght@` +
    f.styles.flatMap((s) => f.weights.map((w) => `${s === "italic" ? 1 : 0},${w}`)).join(";");
  return `https://fonts.googleapis.com/css2?${fam}&display=swap`;
}

function fileBase(f) {
  return f.name.toLowerCase().replace(/ /g, "");
}

async function main() {
  const manifest = {};
  for (const f of FAMILIES) {
    const css = await (await fetch(cssUrl(f), { headers: { "User-Agent": UA } })).text();
    // Split into @font-face blocks; keep latin (last block per style/weight).
    const blocks = css.match(/\/\* [a-z-]+ \*\/\s*@font-face \{[^}]+\}/g) || [];
    for (const b of blocks) {
      const subset = (b.match(/\/\* ([a-z-]+) \*\//) || [])[1];
      if (subset !== "latin") continue;
      const url = (b.match(/url\((https:[^)]+\.woff2)\)/) || [])[1];
      const styleM = b.match(/font-style:\s*(\w+)/);
      const weightM = b.match(/font-weight:\s*(\d+)/);
      if (!url || !styleM || !weightM) continue;
      const fname = `${fileBase(f)}-${weightM[1]}${styleM[1] === "italic" ? "-italic" : ""}.woff2`;
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(OUT, fname), buf);
      manifest[fname] = { family: f.name, weight: weightM[1], style: styleM[1], bytes: buf.length };
      console.log("saved", fname, buf.length + "b");
    }
  }
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("done:", Object.keys(manifest).length, "files");
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
