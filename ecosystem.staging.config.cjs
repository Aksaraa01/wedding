module.exports = {
  apps: [
    {
      name: "aksara-wedding-staging",
      cwd: "/var/www/aksara-wedding-staging",
      script: ".next/standalone/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3003",
        HOSTNAME: "0.0.0.0",
        // Inject staging secrets/server env here on the VPS (standalone does not
        // load .env files). Keep in sync with .env.staging values as needed:
        // NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SITE_ENV, NEXT_PUBLIC_COUPLE_URL_MODE,
        // Supabase staging keys/URL, and side-effect gates (NOTIFY_GROUP_ENABLED=false).
      },
      max_memory_restart: "400M",
      time: true,
    },
  ],
}
