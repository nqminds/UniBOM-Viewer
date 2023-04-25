import express from "express";
import config from "../config.json" assert { type: "json" };

import getVulnerabilityAnalysis from "@nqminds/vulnerability-analysis";
import testCases from "./test-cases.mjs";

import { MorelloOpenSSLTestCase } from "@nqminds/openssl-vuln-poc";

const api = express.Router(); // eslint-disable-line new-cap

const { username, host, sshPort, nistApiKey } = config;

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
  "/morello/:purecap(true|false)/:goodCert(true|false)",
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
      console.error(error); // eslint-disable-line no-console
      res.status(500).json(error.message);
    }
  }
);

api.get("/vulnerability-analysis", async (req, res) => {
  const data = await getVulnerabilityAnalysis(nistApiKey);
  res.send(data);
});

export default api;
