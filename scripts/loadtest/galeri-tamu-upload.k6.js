import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";
import exec from "k6/execution";

const BASE_URL = (__ENV.BASE_URL || "https://wedding-stg.aksaraa.com").replace(/\/$/, "");
const GALLERY_TOKEN = __ENV.GALLERY_TOKEN || "";
const SCENARIO = __ENV.SCENARIO || "burst"; // burst | venue | sustained | idempotency
const VUS = Number(__ENV.VUS || 10);
const DURATION = __ENV.DURATION || "5m";
const PHOTO_FILE = __ENV.PHOTO_FILE || "./scripts/loadtest/fixtures/photo-1750kb.jpg";
const TARGET_BYTES = Number(__ENV.TARGET_BYTES || 1835008); // 1.75MB
const TARGET_WIDTH = Number(__ENV.TARGET_WIDTH || 2400);
const SAME_IP_MODE = __ENV.SAME_IP_MODE === "1";
const CATEGORY = __ENV.CATEGORY || "Teman";
const NAME_PREFIX = __ENV.NAME_PREFIX || "Loadtest";
const ALLOW_PROD = __ENV.ALLOW_PROD === "1";

if (!ALLOW_PROD && /wedding\.aksaraa\.com/i.test(BASE_URL) && !/wedding-stg\.aksaraa\.com/i.test(BASE_URL)) {
  throw new Error(`Refusing to run against production BASE_URL=${BASE_URL}. Set ALLOW_PROD=1 only if you really intend this.`);
}

const photoBin = open(PHOTO_FILE, "b");

export const uploadLatency = new Trend("galeri_upload_latency", true);
export const resolveLatency = new Trend("galeri_resolve_latency", true);
export const uploadOk = new Rate("galeri_upload_ok");
export const upload429 = new Rate("galeri_upload_429");
export const upload409 = new Rate("galeri_upload_409");
export const upload5xx = new Rate("galeri_upload_5xx");
export const dedupOk = new Rate("galeri_dedup_ok");
export const bytesSent = new Counter("galeri_bytes_sent");

export const options = buildOptions();

function buildOptions() {
  const commonThresholds = {
    http_req_failed: ["rate<0.05"],
    galeri_upload_5xx: ["rate<0.01"],
  };

  if (SCENARIO === "burst") {
    return {
      scenarios: {
        burst: {
          executor: "per-vu-iterations",
          vus: VUS,
          iterations: 1,
          maxDuration: "3m",
        },
      },
      thresholds: {
        ...commonThresholds,
        galeri_upload_latency: ["p(95)<5000"],
        galeri_upload_ok: ["rate>0.99"],
      },
    };
  }

  if (SCENARIO === "idempotency") {
    return {
      scenarios: {
        idem: {
          executor: "per-vu-iterations",
          vus: Math.max(1, Math.min(VUS, 5)),
          iterations: 1,
          maxDuration: "2m",
        },
      },
      thresholds: commonThresholds,
    };
  }

  if (SCENARIO === "sustained") {
    return {
      scenarios: {
        sustained: {
          executor: "constant-vus",
          vus: VUS,
          duration: DURATION,
        },
      },
      thresholds: {
        ...commonThresholds,
        galeri_upload_latency: ["p(95)<7000"],
      },
    };
  }

  return {
    scenarios: {
      venue: {
        executor: "constant-vus",
        vus: VUS,
        duration: DURATION,
      },
    },
    thresholds: {
      ...commonThresholds,
      galeri_upload_latency: ["p(95)<7000"],
    },
  };
}

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function deviceId() {
  return `loadtest-${uuidv4()}`;
}

function captureId() {
  return uuidv4();
}

function fakeNatIp(vu) {
  if (!SAME_IP_MODE) return null;
  if (vu % 5 === 0) return `10.88.${vu}.${randomIntBetween(2, 200)}`;
  return "10.88.0.10";
}

function headers(vu) {
  const h = {};
  const ip = fakeNatIp(vu);
  if (ip) {
    h["X-Forwarded-For"] = ip;
    h["X-Real-IP"] = ip; // behind real Caddy these are overwritten; useful for direct/local tests
  }
  return h;
}

function uploadOnce(vu, did, cid) {
  const form = {
    file: http.file(photoBin, `loadtest-${TARGET_WIDTH}-${TARGET_BYTES}.jpg`, "image/jpeg"),
    gallery_token: GALLERY_TOKEN,
    device_id: did,
    capture_id: cid,
    uploader_name: `${NAME_PREFIX} ${vu}`,
    category: CATEGORY,
    caption: `k6 ${SCENARIO} vu=${vu} w=${TARGET_WIDTH} b=${TARGET_BYTES}`,
  };

  const res = http.post(`${BASE_URL}/api/guest-photos/upload`, form, {
    headers: headers(vu),
    tags: { name: "POST /api/guest-photos/upload", scenario: SCENARIO },
    timeout: "120s",
  });

  uploadLatency.add(res.timings.duration);
  bytesSent.add(photoBin.byteLength || TARGET_BYTES);

  const ok = check(res, {
    "status 200": (r) => r.status === 200,
    "has photo": (r) => {
      try { return !!r.json("photo.id"); } catch (_) { return false; }
    },
  });

  uploadOk.add(ok);
  upload429.add(res.status === 429);
  upload409.add(res.status === 409);
  upload5xx.add(res.status >= 500);

  if (!ok) {
    console.warn(`upload fail vu=${vu} status=${res.status} body=${String(res.body).slice(0, 300)}`);
  }
  return res;
}

function resolveOnce(vu, did) {
  const url = `${BASE_URL}/api/gallery/${encodeURIComponent(GALLERY_TOKEN)}?device_id=${encodeURIComponent(did)}`;
  const res = http.get(url, {
    headers: headers(vu),
    tags: { name: "GET /api/gallery/:token", scenario: SCENARIO },
  });
  resolveLatency.add(res.timings.duration);
  check(res, { "resolve 200": (r) => r.status === 200 });
  return res;
}

export function setup() {
  if (!GALLERY_TOKEN) throw new Error("GALLERY_TOKEN wajib");
  const res = http.get(`${BASE_URL}/api/gallery/${encodeURIComponent(GALLERY_TOKEN)}`);
  if (res.status !== 200) throw new Error(`Gallery token tidak bisa diresolve: ${res.status} ${res.body}`);
  return { startedAt: new Date().toISOString() };
}

export default function () {
  const vu = exec.vu.idInTest;
  const did = deviceId();

  if (SCENARIO === "idempotency") {
    const cid = captureId();
    const r1 = uploadOnce(vu, did, cid);
    const r2 = uploadOnce(vu, did, cid);
    const r3 = uploadOnce(vu, did, cid);
    const dedup = [r2, r3].every((r) => {
      try { return r.status === 200 && r.json("dedup") === true; } catch (_) { return false; }
    });
    dedupOk.add(dedup);
    check(r1, { "first upload 200": (r) => r.status === 200 });
    return;
  }

  if (SCENARIO === "sustained") {
    if (Math.random() < 0.3) {
      resolveOnce(vu, did);
    } else {
      uploadOnce(vu, did, captureId());
    }
    sleep(randomIntBetween(1, 3));
    return;
  }

  if (SCENARIO === "venue") {
    const shots = randomIntBetween(2, 4);
    for (let i = 0; i < shots; i++) {
      uploadOnce(vu, did, captureId());
      sleep(randomIntBetween(10, 30));
    }
    return;
  }

  uploadOnce(vu, did, captureId());
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data),
    "./tmp/k6-galeri-tamu-summary.json": JSON.stringify(data, null, 2),
  };
}

function textSummary(data) {
  const m = data.metrics;
  const line = (k) => (m[k] ? JSON.stringify(m[k].values) : "n/a");
  return [
    `Scenario: ${SCENARIO}`,
    `Target: ${BASE_URL}`,
    `Token: ${GALLERY_TOKEN.slice(0, 8)}...`,
    `Target payload: ~${TARGET_BYTES} bytes, width ${TARGET_WIDTH}`,
    `http_req_duration: ${line("http_req_duration")}`,
    `galeri_upload_latency: ${line("galeri_upload_latency")}`,
    `galeri_upload_ok: ${line("galeri_upload_ok")}`,
    `galeri_upload_429: ${line("galeri_upload_429")}`,
    `galeri_upload_409: ${line("galeri_upload_409")}`,
    `galeri_upload_5xx: ${line("galeri_upload_5xx")}`,
    `galeri_dedup_ok: ${line("galeri_dedup_ok")}`,
  ].join("\n");
}
