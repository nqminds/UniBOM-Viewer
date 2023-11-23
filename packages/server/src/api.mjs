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
  const validatedKeys = {};
  let errorMessage;

  if (nistKey) {
    if (
      !validator.isLength(nistKey, { min: 10 }) ||
      !validator.isAlphanumeric(nistKey, "en-US", { ignore: "-_" })
    ) {
      errorMessage = "Invalid NIST API Key format.";
    } else {
      validatedKeys.nistApiKey = nistKey;
    }
  }

  if (openaiKey) {
    if (
      !validator.isLength(openaiKey, { min: 10 }) ||
      !validator.isAlphanumeric(openaiKey, "en-US", { ignore: "-_" })
    ) {
      errorMessage = "Invalid OpenAI API Key format.";
    } else {
      validatedKeys.openaiApiKey = openaiKey;
    }
  }

  // Return the original key if empty or the validated key
  return {
    nistApiKey: validatedKeys.nistApiKey || nistKey,
    openaiApiKey: validatedKeys.openaiApiKey || openaiKey,
    errorMessage: errorMessage,
  };
}

function validateCycloneDX(jsonObject) {
  if (jsonObject.bomFormat !== "CycloneDX") {
    return false;
  }
  if (!jsonObject.components || !Array.isArray(jsonObject.components)) {
    return false;
  }
  return true;
}

// eslint-disable-next-line consistent-return
api.post("/vulnerability-analysis", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }
  const file = req.file;
  const fileContent = file.buffer.toString("utf-8");
  const jsonObject = JSON.parse(fileContent);

  if (!validateCycloneDX(jsonObject)) {
    return res.status(400).send("The file is not a valid CycloneDX JSON");
  }

  let nistApiKey;
  let openaiApiKey;
  try {
    const validatedKeys = validateApiKeys(
      req.body.nistApiKey,
      req.body.openaiApiKey
    );
    if (validatedKeys.errorMessage) {
      return res.status(400).send({ error: validatedKeys.errorMessage });
    }
    nistApiKey = validatedKeys.nistApiKey;
    openaiApiKey = validatedKeys.openaiApiKey;
  } catch (error) {
    console.error(error);
    // Send an error response back to the client
    res.status(400).send({ error: error.message });
  }

  const apiKeys = {
    nist: nistApiKey,
    openai: openaiApiKey,
  };

  const data = await extractDetails(jsonObject, apiKeys);
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
