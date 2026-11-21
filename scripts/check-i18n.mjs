#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

function walk(d){const o=[]; for(const f of readdirSync(d)){const p=path.join(d,f); const s=statSync(p); if(s.isDirectory()) o.push(...walk(p)); else if(/\.(ts|tsx)$/.test(f)) o.push(p);} return o;}

const root = process.cwd();
const i18nPath = path.join(root, "src/lib/i18n.ts");
const src = readFileSync(i18nPath, "utf8");
const keyBlock = src.match(/export const I18N = \{([\s\S]*?)\} as const/);
if(!keyBlock) { console.error("✗ could not parse I18N keys"); process.exit(1); }
const keys = new Set([...keyBlock[1].matchAll(/^\s*([A-Za-z0-9_]+)\s*:\s*\{/gm)].map(m=>m[1]));
// Also allow nested keys? no, flat.
const files = walk(path.join(root,"src")).filter(f=>!f.endsWith("src/lib/i18n.ts"));
const missing = [];
const used = new Set();
for(const f of files){
  const s = readFileSync(f, "utf8");
  for(const m of s.matchAll(/\b(?:t|tf)\(\s*["']([A-Za-z0-9_]+)["']/g)){
    used.add(m[1]);
    if(!keys.has(m[1])) missing.push({file:path.relative(root,f), key:m[1]});
  }
}
if(missing.length){
  console.error(`✗ i18n: ${missing.length} missing key reference(s):`);
  for(const m of missing.slice(0,30)) console.error(`  - ${m.key} (${m.file})`);
  if(missing.length>30) console.error(`  …and ${missing.length-30} more`);
  process.exit(1);
}
console.log(`✓ i18n keys valid (${used.size} used / ${keys.size} defined)`);
