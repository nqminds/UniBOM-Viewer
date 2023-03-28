/* eslint-disable no-console */
const express = require("express");
const next = require("next");
const config = require("config");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = express();

    server.get(
      "/api/morello/:purecap(true|false)/:goodCert(true|false)",
      async (req, res) => {
        const { purecap, goodCert } = req.params;
        try {
          const result = await fetch(
            `${config.get("serverAddress")}/run-script/${purecap}/${goodCert}`,
            {
              referrerPolicy: "strict-origin-when-cross-origin",
              body: null,
              method: "GET",
            }
          );
          const data = await result.json();
          res.send(data);
        } catch (error) {
          console.log(error);
          if (error.errno === "ECONNREFUSED") {
            console.log(
              "Have you started the server on:",
              config.get("serverAddress")
            );
          }
          res.send({ error });
        }
      }
    );

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
