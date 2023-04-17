import express from "express";
import config from "../config.json" assert { type: "json" };

import getVulnerabilityAnalysis from "@nqminds/vulnerability-analysis";
import testCases from "./test-cases.mjs";

const testCaseCache = {
  purecap: {
    goodCert: null,
    maliciousCert: null,
  },
  hybrid: {
    goodCert: null,
    maliciousCert: null,
  },
};

const api = express();

const { username, host, sshPort, nistApiKey } = config;

let callIndex = 0;
const getOpensllPort = (callIndexLocal) => 31050 + (callIndexLocal % 1000);

api.get(
  "/run-script/:purecap(true|false)/:goodCert(true|false)",
  async (req, res) => {
    const { purecap, goodCert } = req.params;
    const mode = purecap === "true" ? "purecap" : "hybrid";
    const certificate = goodCert === "true" ? "goodCert" : "maliciousCert";
    let TestCase = null;
    let testCase = testCaseCache[mode][certificate];
    const opensslPort = getOpensllPort(callIndex);
    callIndex++;
    if (testCase) {
      try {
        const {
          server: { stdin, stdout, stderr },
        } = await testCase.run({ port: opensslPort });
        res.send({ stdin, stdout, stderr });
      } catch (error) {
        res.status(500).json(error.message);
      }
    } else {
      TestCase = testCases[mode][certificate];
      if (TestCase) {
        try {
          const sshOpts = { username, host, port: sshPort };
          testCase = new TestCase({ sshOpts });
          await testCase.setup();
          testCaseCache[mode][certificate] = testCase;
          const {
            server: { stdin, stdout, stderr },
          } = await testCase.run({ port: opensslPort });
          res.send({ stdin, stdout, stderr });
        } catch (error) {
          res.status(500).json(error.message);
        }
      } else {
        res
          .status(501)
          .json(
            `${certificate} certificate for ${mode} mode is not implemented`
          );
      }
    }
  }
);

api.get("/vulnerability-analysis", async (req, res) => {
  const data = await getVulnerabilityAnalysis(nistApiKey);
  res.send(data);
});

export default api;
