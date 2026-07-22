module.exports = {
  apps: [
    {
      name: "nexorapro",
      cwd: "/var/www/nexorapro/current",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "768M",
      time: true,
      env: {
        NODE_ENV: "production",
        HOSTNAME: "127.0.0.1",
        PORT: "3000",
      },
    },
  ],
};
