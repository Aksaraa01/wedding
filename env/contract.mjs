// Per-environment contract for the wedding app.
//
// Key names and expected (public, non-secret) values only — never a secret.
// `scripts/build-env.mjs` validates the build environment against this file and
// bakes the identity into `.next/build-env.json` + `.next/standalone/RELEASE.json`;
// `scripts/predeploy-guard.mjs` refuses a bundle whose identity does not match
// the target.
//
// Anything in `buildPublic` is inlined by Next at build time, so it must be
// present when `next build` runs. `runtimeRequired` is read by the server at
// runtime and is injected by the PM2 ecosystem / --env-file on the host.

export const CONTRACT = {
  prod: {
    ref: "ylmfgorryxzpdckkebnr",
    // sha256 of NEXT_PUBLIC_SUPABASE_ANON_KEY. The anon key is public (it ships
    // in the browser bundle); the hash is what makes "the right project was
    // baked" provable, because a hardcoded URL literal in source cannot satisfy
    // it. Rotating the key means updating this line — deliberately.
    anonKeySha256: "0a46e8a2212dac900e2a7a25de34c6f81f9891a445013aaba96d0468ef7c54a3",
    buildPublic: {
      NEXT_PUBLIC_SUPABASE_URL: "https://ylmfgorryxzpdckkebnr.supabase.co",
      NEXT_PUBLIC_SITE_URL: "https://wedding.aksaraa.com",
      NEXT_PUBLIC_SITE_ENV: "production",
      NEXT_PUBLIC_COUPLE_URL_MODE: "subdomain",
      NEXT_PUBLIC_WP_ORIGIN: "https://wp.aksaraa.com",
    },
    optionalPublic: [
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_COUPLE_APEX_DOMAIN",
      "NEXT_PUBLIC_CS_WIDGET",
    ],
    forbiddenPublic: {
      NEXT_PUBLIC_SITE_URL: "https://wedding-stg.aksaraa.com",
      NEXT_PUBLIC_SITE_ENV: "staging",
      NEXT_PUBLIC_COUPLE_URL_MODE: "path",
    },
    runtimeRequired: [
      "SUPABASE_SERVICE_ROLE_KEY",
      "WP_INTERNAL_SECRET",
      "SCANNER_JWT_SECRET",
      "AUTH_SESSION_SECRET",
      "CRON_SECRET",
      "WA_TARGET_GROUP_JID",
      "OPENROUTER_API_KEY",
      "GUEST_PHOTOS_CLEANUP_TOKEN",
    ],
    gates: { NOTIFY_GROUP_ENABLED: true },
  },

  staging: {
    ref: "jclolnjkjhyjilvymagr",
    anonKeySha256: "fb107ea953f6db46d1fdd1edcc953e8879610bd475c245f5d6b41a2e4264493a",
    buildPublic: {
      NEXT_PUBLIC_SUPABASE_URL: "https://jclolnjkjhyjilvymagr.supabase.co",
      NEXT_PUBLIC_SITE_URL: "https://wedding-stg.aksaraa.com",
      NEXT_PUBLIC_SITE_ENV: "staging",
      NEXT_PUBLIC_COUPLE_URL_MODE: "path",
    },
    optionalPublic: [
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_WP_ORIGIN",
      "NEXT_PUBLIC_COUPLE_APEX_DOMAIN",
      "NEXT_PUBLIC_CS_WIDGET",
    ],
    forbiddenPublic: {},
    runtimeRequired: ["SUPABASE_SERVICE_ROLE_KEY", "WP_INTERNAL_SECRET", "SCANNER_JWT_SECRET"],
    gates: { NOTIFY_GROUP_ENABLED: false },
  },
}

export const ENV_NAMES = Object.keys(CONTRACT)
