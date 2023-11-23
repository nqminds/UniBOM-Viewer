/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
const express = require("express");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({dev});
const handle = app.getRequestHandler();

app
  .prepare()
  .then(async () => {
    const server = express();

    const {default: api} = await import("@nqminds/cyber-demonstrator-server");

    server.use("/api", api);

    server.get("*", (req, res) => {
      return handle(req, res);
    });

    server.listen(8082, (err) => {
      if (err) throw err;
      console.log("Ready on http://localhost:8082");
    });
  })
  .catch((ex) => {
    console.error(ex.stack);
    process.exit(1);
  });
