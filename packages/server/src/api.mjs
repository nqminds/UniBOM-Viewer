import express from "express";
import config from "../config.json" assert { type: "json" };
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL(".", import.meta.url));
import path from "path";

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

const { username, host, sshPort } = config;

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
          await testCase.setup({
            certDirectory: path.join(
              __dirname,
              "../../openssl-vuln-poc",
              "certs"
            ),
          });
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

export default api;
