module.exports = {
  apps: [
    {
      name: "alumni-portal-api",
      script: "server.js",
      instances: "max",           // One process per CPU core
      exec_mode: "cluster",       // Cluster mode — shares port, load balanced
      watch: false,               // Don't watch files in production
      max_memory_restart: "500M", // Restart if memory exceeds 500MB
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: "development",
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 4000,
      },
      // Log configuration
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};
