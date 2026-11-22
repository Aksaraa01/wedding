// Production PM2 ecosystem (template, no secrets).
// Install on server as /var/www/aksara-wedding/ecosystem.config.js (or symlink)
// and keep /var/www/aksara-wedding/.env.production (chmod 600) with runtime keys.
// See env/contract.mjs for required runtime keys.
module.exports = {
  apps: [
    {
      name: "aksara-wedding",
      cwd: "/var/www/aksara-wedding/.next/standalone",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      node_args: ["--env-file=/var/www/aksara-wedding/.env.production"],
      env: {
        NODE_ENV: "production",
        PORT: "3002",
        HOSTNAME: "127.0.0.1",
      },
      max_memory_restart: "900M",
      time: true,
    },
  ],
}
