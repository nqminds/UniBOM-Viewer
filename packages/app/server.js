/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
const express = require("express");
const next = require("next");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const app = next({dev});
const handle = app.getRequestHandler();

app
  .prepare()
  .then(async () => {
    const server = express();

    const {default: api} = await import("@nqminds/cyber-demonstrator-server");

    server.use("/api", api);

    // Define a route for the verification file
    server.get("/.well-known/pki-validation/fileauth.txt", (req, res) => {
      console.log(__dirname);
      const filePath = path.join(__dirname, "public", "fileauth.txt");
      res.sendFile(filePath);
    });

    server.get("*", (req, res) => {
      return handle(req, res);
    });

    server.listen(8082, "0.0.0.0", (err) => {
      if (err) throw err;
      console.log("Ready on http://0.0.0.0:8082");
    });
  })
  .catch((ex) => {
    console.error(ex.stack);
    process.exit(1);
  });
