/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
const express = require("express");
const next = require("next");
const config = require("config");
const fs = require("fs");
const multer = require("multer");
const upload = multer({dest: "uploads/"});
const FormData = require("form-data");

const dev = process.env.NODE_ENV !== "production";
const app = next({dev});
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = express();

    // TODO: should we use Next.JS Dynamic API Routes instead? https://nextjs.org/docs/api-routes/dynamic-api-routes
    server.get(
      "/api/morello/:purecap(true|false)/:goodCert(true|false)",
      async (req, res) => {
        const {purecap, goodCert} = req.params;
        try {
          const result = await fetch(
            `${config.get("serverAddress")}/run-script/${purecap}/${goodCert}`,
            {
              referrerPolicy: "strict-origin-when-cross-origin",
              body: null,
              method: "GET",
            },
          );
          const data = await result.json();
          res.send(data);
        } catch (error) {
          console.log(error);
          if (error.errno === "ECONNREFUSED") {
            console.log(
              "Have you started the server on:",
              config.get("serverAddress"),
            );
          }
          res.send({error});
        }
      },
    );

    server.get("/api/vulnerability-analysis", async (req, res) => {
      try {
        const result = await fetch(
          `${config.get("serverAddress")}/vulnerability-analysis`,
          {
            referrerPolicy: "strict-origin-when-cross-origin",
            body: null,
            method: "GET",
          },
        );
        const data = await result.json();
        res.send(data);
      } catch (error) {
        console.log(error);
        if (error.errno === "ECONNREFUSED") {
          console.log(
            "Have you started the server on:",
            config.get("serverAddress"),
          );
        }
        res.send({error});
      }
    });

    server.get("*", (req, res) => {
      return handle(req, res);
    });

    server.post(
      "/api/vulnerability-analysis",
      upload.single("file"),
      async (req, res) => {
        const file = req.file;
        const nistApiKey = req.body.nistApiKey;
        const openaiApiKey = req.body.openaiApiKey;
        if (!file) {
          console.warn("No file uploaded");
          res.status(400).send({error: "No file uploaded"});
          return;
        }
        if (!nistApiKey) {
          console.warn("API key for NIST is missing!");
          res.status(400).send({error: "API keys are missing"});
          return;
        }
        try {
          const formData = new FormData();
          formData.append("file", fs.createReadStream(file.path));
          formData.append("nistApiKey", nistApiKey);
          formData.append("openaiApiKey", openaiApiKey);

          const response = await fetch(
            `${config.get("serverAddress")}/vulnerability-analysis`,
            {
              referrerPolicy: "strict-origin-when-cross-origin",
              method: "POST",
              body: formData,
            },
          );

          if (response.status === 400) {
            const errorDetails = await response.json();
            res.status(400).send({error: errorDetails});
          }

          const contentType = response.headers.get("content-type");
          // Ensure is JSON
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await response.json();
            res.send(data);
          } else {
            // Handle non-JSON response or throw an error
            const text = await response.text();
            console.error("Non-JSON response:", text);
            res.status(500).send({error: "Unexpected server response"});
          }
        } catch (error) {
          console.log(error);
          if (error.errno === "ECONNREFUSED") {
            console.log(
              "Have you started the server on:",
              config.get("serverAddress"),
            );
          }
          res.send({error});
        } finally {
          try {
            if (file && file.path) {
              // delete the uploaded file after processing
              fs.unlinkSync(file.path);
            }
          } catch (fileDelErr) {
            console.error("Error deleting file:", fileDelErr);
          }
        }
      },
    );

    server.listen(8082, (err) => {
      if (err) throw err;
      console.log("Ready on http://localhost:8082");
    });
  })
  .catch((ex) => {
    console.error(ex.stack);
    process.exit(1);
  });
