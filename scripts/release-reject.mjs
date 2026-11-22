#!/usr/bin/env node
import { spawnSync } from "node:child_process"
const args = process.argv.slice(2)
const r = spawnSync(process.execPath, ["scripts/release-verify.mjs", "--reject", ...args], { stdio: "inherit" })
process.exit(r.status ?? 1)
