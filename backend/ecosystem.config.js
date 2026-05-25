module.exports = {
  apps: [
    {
      name: "backend-api",
      script: "./dist/index.modular.js",
      instances: 1,
      exec_mode: "fork",

      node_args:
        "--max-old-space-size=512 --max-semi-space-size=16 --optimize-for-size",

      max_memory_restart: "550M",

      autorestart: true,
      restart_delay: 5000,
      watch: false,

      env: {
        NODE_ENV: "production"
      },

      time: true
    }
  ]
};
