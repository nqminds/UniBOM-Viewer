module.exports = {
  apps: [
    {
      name: "cyber",
      script: "server.js",
      node_args: "--max-old-space-size=2048",

      // Logging
      out_file: "./out.log",
      error_file: "./error.log",
      merge_logs: true,
      log_date_format: "DD-MM HH:mm:ss Z",
      log_type: "json",

      // Environment-specific configurations
      // pm2 start ecosystem.config.js --env production
      env: {
        NODE_ENV: "dev", // Default environment
      },
      env_production: {
        NODE_ENV: "production", // Production environment
      },

      // Event hooks
      events: {
        restart:
          "node ../vulnerability-analysis-tools/scripts/notification.mjs",
        exit: "node ../vulnerability-analysis-tools/scripts/notification.mjs",
      },
    },
  ],
};
