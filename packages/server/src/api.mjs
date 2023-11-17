/* eslint-disable no-console */
import express from "express";
import config from "../config.json" assert { type: "json" };
import validator from "validator";

import { extractDetails } from "../../vulnerability-analysis-tools/src/vulnerability-analysis.mjs";

import testCases from "./test-cases.mjs";

import { MorelloOpenSSLTestCase } from "@nqminds/openssl-vuln-poc";
import multer from "multer";

const api = express();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const { username, host, sshPort } = config;

const sshOpts = { username, host, port: sshPort };
/** @type {boolean | Error} `true` is the server is setup. `Error` is the server failed to setup. */
let morelloSetup = false;

(async function () {
  await new MorelloOpenSSLTestCase({ sshOpts }).setup();
})()
  .then(() => {
    morelloSetup = true;
  })
  .catch((error) => {
    morelloSetup = error;
  });
const morelloSetupStartTime = Date.now();

let callIndex = 0;
const getOpensllPort = (callIndexLocal) => 31050 + (callIndexLocal % 1000);

api.get(
  "/run-script/:purecap(true|false)/:goodCert(true|false)",
  async (req, res) => {
    const { purecap, goodCert } = req.params;
    const mode = purecap === "true" ? "purecap" : "hybrid";
    const certificate = goodCert === "true" ? "goodCert" : "maliciousCert";

    const opensslPort = getOpensllPort(callIndex);
    callIndex++;

    const TestCase = testCases[mode][certificate];
    if (TestCase === undefined || TestCase === null) {
      res
        .status(501)
        .json(`${certificate} certificate for ${mode} mode is not implemented`);
      return;
    }

    try {
      const testCase = new TestCase({ sshOpts });
      if (testCase instanceof MorelloOpenSSLTestCase) {
        // testCase.setup() takes a very long time for test cases that run on an
        // Morello Server, so we have custom setup code for it
        if (morelloSetup !== true) {
          if (morelloSetup === false) {
            res
              .status(503)
              .set("Retry-After", "120")
              .json(
                "Morello Server is still setting up, please try again in a few seconds. " +
                  "Setting up usually takes 5-10 minutes. " +
                  `ETA: approx ${
                    600 - (Date.now() - morelloSetupStartTime) / 1000
                  }s left.`
              ); // setup may take 5-10 minutes
            return;
          } else {
            throw new Error(
              "Setting up the Morello Server failed, please restart the server.\n" +
                "This normally happens if the Morello SSH connection failed.",
              {
                cause:
                  morelloSetup instanceof Error
                    ? morelloSetup
                    : new Error(morelloSetup),
              }
            );
          }
        }
      } else {
        // if not on Morello, setup is very fast, so we can do it every time.
        await testCase.setup();
      }

      const {
        server: { stdin, stdout, stderr },
      } = await testCase.run({ port: opensslPort });
      res.send({ stdin, stdout, stderr });
    } catch (error) {
      res.status(500).json(error.message);
    }
  }
);

function validateApiKeys(nistKey, openaiKey) {
  if (!nistKey || !openaiKey) {
    throw new Error("Both API keys must be provided.");
  }

  // Using `isLength` to check if the keys have a reasonable length
  // and `isAlphanumeric` to ensure they consist of alphanumeric characters
  if (
    !validator.isLength(nistKey, { min: 10 }) ||
    !validator.isAlphanumeric(nistKey, "en-US", { ignore: "-_" })
  ) {
    throw new Error("Invalid NIST API Key format.");
  }

  if (
    !validator.isLength(openaiKey, { min: 10 }) ||
    !validator.isAlphanumeric(openaiKey, "en-US", { ignore: "-_" })
  ) {
    throw new Error("Invalid OpenAI API Key format.");
  }

  // Add any additional security checks here

  return { nistApiKey: nistKey, openaiApiKey: openaiKey };
}

// eslint-disable-next-line consistent-return
api.post("/vulnerability-analysis", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }
  const file = req.file;
  const fileContent = file.buffer.toString("utf-8");
  const jsonObject = JSON.parse(fileContent);

  let nistApiKey;
  let openaiApiKey;
  try {
    // Assume req.body.nistApiKey and req.body.openaiApiKey are the API keys from the request
    const validatedKeys = validateApiKeys(
      req.body.nistApiKey,
      req.body.openaiApiKey
    );
    nistApiKey = validatedKeys.nistApiKey;
    openaiApiKey = validatedKeys.openaiApiKey;

    // Now you can use nistApiKey and openaiApiKey as needed
  } catch (error) {
    console.error(error);
    // Send an error response back to the client
    res.status(400).send({ error: error.message });
  }
  // TODO: use the api keys instead of the .env files
  console.log("NIST API KEY", nistApiKey);
  console.log("OPENAI API KEY", openaiApiKey);

  const data = await extractDetails(jsonObject);
  res.send(data);
});

// Error handling middleware for Multer
api.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    res.status(400).send("File upload error");
  } else if (err) {
    res.status(400).send(err.message);
  } else {
    next();
  }
});

export default api;
