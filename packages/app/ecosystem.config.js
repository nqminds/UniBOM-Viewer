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

      env: {
        NODE_ENV: "dev",
      },
      events: {
        restart:
          "node ../vulnerability-analysis-tools/scripts/notification.mjs",
        exit: "node ../vulnerability-analysis-tools/scripts/notification.mjs",
      },
    },
  ],
};
