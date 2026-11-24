#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const args = {};
for (let i=2;i<process.argv.length;i++){const a=process.argv[i]; if(!a.startsWith('--')) continue; const k=a.slice(2); if(k.includes('=')){const [kk,...r]=k.split('='); args[kk]=r.join('=');} else if(i+1<process.argv.length && !process.argv[i+1].startsWith('--')) args[k]=process.argv[++i]; else args[k]='true';}
const input = args.in || args.input;
const out = args.out || 'framed.jpg';
const couple = (args.couple || 'Galeri & Test').toUpperCase();
const date = args.date || '22 · 11 · 2026';
const filter = args.filter || 'kodak-funsaver';
if(!input) throw new Error('--in required');

const filters = {
  'normal': [],
  'kodak-funsaver': {modulate:{saturation:1.35, brightness:1.06}, gamma:1.0, tint:{r:255,g:236,b:205}},
};
function escapeXml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

const src = sharp(input).rotate();
const meta = await src.metadata();
const sw = meta.width || 1200, sh = meta.height || 1600;
const aspect = sh / Math.max(1,sw);
const landscape = aspect < 1;
const W = Math.min(sw, Number(args.width||1920));
const cardW = Math.round(W * (landscape ? 0.88 : 0.84));
const cardX = Math.round((W - cardW) / 2);
const pad = Math.round(cardW * 0.075);
const photoW = cardW - pad*2;
const photoH = Math.round(photoW * Math.min(1.35, Math.max(0.55, aspect)));
const headerH = Math.round(cardW * (landscape ? 0.16 : 0.20));
const footerH = Math.round(cardW * (landscape ? 0.10 : 0.16));
const cardY = Math.round(cardW * 0.06);
const photoY = cardY + headerH;
const cardH = headerH + photoH + footerH;
const H = cardY + cardH + Math.round(cardW * 0.08);

let photo = sharp(input).rotate().resize(photoW, photoH, {fit:'cover'});
if (filter === 'kodak-funsaver') {
  photo = photo.modulate({saturation:1.35, brightness:1.06}).tint({r:255,g:236,b:205});
}
const photoBuf = await photo.jpeg({quality:Number(args.quality||95)}).toBuffer();

const nameSize = Math.round(cardW * (landscape ? 0.045 : 0.058));
const labelSize = Math.round(cardW * 0.024);
const dateSize = Math.round(cardW * 0.026);
const footSize = Math.round(cardW * 0.025);
const coupleEsc = escapeXml(couple);
const dateEsc = escapeXml(date);

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#fbf9f4"/>
  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" fill="#f8f5ee" stroke="rgba(27,28,25,0.08)" stroke-width="${Math.max(1,W*0.0012)}"/>
  <text x="${cardX+pad}" y="${cardY+Math.round(cardW*0.08)}" font-family="Arial, sans-serif" font-size="${labelSize}" font-weight="600" letter-spacing="3" fill="#1b1c19">THE WEDDING OF</text>
  <text x="${cardX+pad}" y="${cardY+Math.round(cardW*0.14)}" font-family="Georgia, serif" font-size="${nameSize}" font-weight="400" fill="#1b1c19">${coupleEsc}</text>
  <text x="${cardX+cardW-pad}" y="${cardY+Math.round(cardW*0.08)}" text-anchor="end" font-family="Arial, sans-serif" font-size="${dateSize}" font-weight="600" fill="#1b1c19">${dateEsc}</text>
  <rect x="${cardX+pad}" y="${photoY}" width="${photoW}" height="${photoH}" fill="#ddd"/>
  <rect x="${cardX+pad+Math.round(cardW*0.022)}" y="${photoY+Math.round(cardW*0.022)}" width="${photoW-Math.round(cardW*0.044)}" height="${photoH-Math.round(cardW*0.044)}" fill="none" stroke="rgba(27,28,25,0.22)" stroke-width="${Math.max(1,W*0.0014)}"/>
  <text x="${cardX+pad}" y="${photoY+photoH+Math.round(cardW*0.07)}" font-family="Arial, sans-serif" font-size="${footSize}" font-weight="600" letter-spacing="2" fill="#1b1c19">A NEW CHAPTER</text>
  <text x="${cardX+pad}" y="${photoY+photoH+Math.round(cardW*0.11)}" font-family="Arial, sans-serif" font-size="${footSize}" font-weight="600" letter-spacing="2" fill="#1b1c19">TOGETHER</text>
</svg>`;

let base = sharp(Buffer.from(svg)).png();
const composites = [{input: photoBuf, left: cardX+pad, top: photoY}];
try {
  const floral = await sharp(path.resolve('public/frames/ivory-dahlia.png')).resize(Math.round(W*0.42)).png().toBuffer();
  const fmeta = await sharp(floral).metadata();
  composites.push({input: floral, left: Math.max(0, W - (fmeta.width||200) - Math.round(W*0.02)), top: Math.max(0, H - (fmeta.height||200) - Math.round(W*0.01))});
} catch {}

await base.composite(composites).jpeg({quality:Number(args.quality||95), mozjpeg:true}).toFile(out);
const stat = await fs.stat(out);
console.log(JSON.stringify({out, bytes: stat.size, W, H}));
