#!/usr/bin/env node
import fs from "node:fs/promises";

const BASE_URL = (process.env.BASE_URL || "https://wedding-stg.aksaraa.com").replace(/\/$/, "");
const GALLERY_TOKEN = process.env.GALLERY_TOKEN;
const VUS = Number(process.env.VUS || 5);
const PHOTO_FILE = process.env.PHOTO_FILE || "./scripts/loadtest/fixtures/photo-1750kb.jpg";
const ALLOW_PROD = process.env.ALLOW_PROD === "1";
if (!GALLERY_TOKEN) throw new Error("GALLERY_TOKEN wajib");
if (!ALLOW_PROD && /wedding\.aksaraa\.com/i.test(BASE_URL) && !/wedding-stg\.aksaraa\.com/i.test(BASE_URL)) {
  throw new Error("Refusing prod");
}

const photo = await fs.readFile(PHOTO_FILE);
function uuid() { return crypto.randomUUID(); }
function deviceId() { return `00000000-0000-4000-8000-${Math.floor(Math.random()*0xffffffffffff).toString(16).padStart(12,"0")}`; }

async function uploadOnce(i) {
  const did = deviceId();
  const cid = uuid();
  const form = new FormData();
  form.append("file", new Blob([photo], { type: "image/jpeg" }), `loadtest-${i}.jpg`);
  form.append("gallery_token", GALLERY_TOKEN);
  form.append("device_id", did);
  form.append("capture_id", cid);
  form.append("uploader_name", `Loadtest ${i}`);
  form.append("category", "Teman");
  form.append("caption", `burst vu=${i}`);
  const t0 = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/guest-photos/upload`, { method: "POST", body: form });
    const body = await res.text();
    let json; try { json = JSON.parse(body); } catch {}
    return { i, status: res.status, ms: Date.now()-t0, ok: res.status===200 && !!json?.photo?.id, used: json?.used, err: json?.error, dedup: json?.dedup };
  } catch (e) {
    return { i, status: 0, ms: Date.now()-t0, ok: false, err: String(e) };
  }
}

const t0 = Date.now();
const results = await Promise.all(Array.from({length: VUS}, (_,i)=>uploadOnce(i+1)));
const totalMs = Date.now()-t0;
const oks = results.filter(r=>r.ok);
const lats = results.map(r=>r.ms).sort((a,b)=>a-b);
const pct = (p)=>lats[Math.min(lats.length-1, Math.floor(p*lats.length))];
console.log(JSON.stringify({
  vus: VUS, totalMs, ok: oks.length, fail: results.length-oks.length,
  p50: pct(0.5), p95: pct(0.95), max: lats[lats.length-1],
  statuses: results.reduce((a,r)=>{a[r.status]=(a[r.status]||0)+1; return a;},{}),
  results,
}, null, 2));
