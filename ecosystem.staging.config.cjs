// Staging PM2 ecosystem (template, no secrets).
// Install on server as /var/www/aksara-wedding-staging/ecosystem.config.js and keep
// /var/www/aksara-wedding-staging/.env.production (chmod 600) with runtime keys.
module.exports = {
  apps: [
    {
      name: "aksara-wedding-staging",
      cwd: "/var/www/aksara-wedding-staging/.next/standalone",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      node_args: ["--env-file=/var/www/aksara-wedding-staging/.env.production"],
      env: {
        NODE_ENV: "production",
        PORT: "3003",
        HOSTNAME: "127.0.0.1",
      },
      max_memory_restart: "900M",
      time: true,
    },
  ],
}
