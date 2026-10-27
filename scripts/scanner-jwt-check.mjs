import { createHash, createHmac } from "crypto"
import {
  signScannerJwt,
  signScannerRefreshToken,
  verifyScannerJwt,
  verifyScannerRefreshToken,
  pinFingerprint,
} from "../src/lib/scannerJwt.ts"

process.env.SCANNER_JWT_SECRET = "test-secret"

const PROFILE = "6a7ad151-c3b4-43e8-8429-0b58b4d0736b"
const results = []
const check = (name, cond, extra = "") => {
  results.push(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`)
}

// 1. new token round-trip
const tok = await signScannerJwt(PROFILE, "620383")
check("new token is base64url", /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(tok))
const claims = await verifyScannerJwt(tok)
check("new token verifies", claims?.weddingProfileId === PROFILE)
check("pin fingerprint stamped", claims?.pinHash === pinFingerprint("620383"))

// 2. legacy raw-JSON token still verifies (tokens already in kiosk storage)
const key = createHash("sha256").update(process.env.SCANNER_JWT_SECRET).digest("hex")
const now = Math.floor(Date.now() / 1000)
const legacyPayload = JSON.stringify({ sub: PROFILE, scope: "scanner", iat: now, exp: now + 3600 })
const legacyData = `${JSON.stringify({ alg: "HS256", typ: "JWT" })}.${legacyPayload}`
const legacySig = createHmac("sha256", key).update(legacyData).digest("base64url")
const legacy = await verifyScannerJwt(`${legacyData}.${legacySig}`)
check("legacy raw-JSON token verifies", legacy?.weddingProfileId === PROFILE)
check("legacy token has no pin hash", legacy?.pinHash === "")

// 3. expired
const expPayload = JSON.stringify({ sub: PROFILE, scope: "scanner", iat: now - 7200, exp: now - 60 })
const expData = `${JSON.stringify({ alg: "HS256", typ: "JWT" })}.${expPayload}`
const expSig = createHmac("sha256", key).update(expData).digest("base64url")
check("expired token rejected", (await verifyScannerJwt(`${expData}.${expSig}`)) === null)

// 4. scopes are not interchangeable
const refresh = await signScannerRefreshToken(PROFILE, "620383")
check("refresh token rejected as access token", (await verifyScannerJwt(refresh)) === null)
check("access token rejected as refresh token", (await verifyScannerRefreshToken(tok)) === null)
check("refresh token verifies as refresh", (await verifyScannerRefreshToken(refresh))?.weddingProfileId === PROFILE)

// 5. tampered signature
check("tampered token rejected", (await verifyScannerJwt(tok.slice(0, -2) + "aa")) === null)

console.log(results.join("\n"))
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0)
