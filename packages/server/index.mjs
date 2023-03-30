/* eslint-disable no-console */
import express from "express";
import config from "./config.json" assert { type: "json" };
import {
  MorelloPurecapOpenSSLTestCase,
  MorelloHybridOpenSSLTestCase,
} from "@nqminds/openssl-vuln-poc";

const scriptPaths = {
  purecap: {
    goodCert: null,
    maliciousCert: MorelloPurecapOpenSSLTestCase,
  },
  hybrid: {
    goodCert: null,
    maliciousCert: MorelloHybridOpenSSLTestCase,
  },
};

const app = express();

const { serverPort, userID, key, IP, port } = config;

app.get(
  "/run-script/:purecap(true|false)/:goodCert(true|false)",
  async (req, res) => {
    const { purecap, cert } = req.params;
    const mode = purecap === "true" ? "purecap" : "hybrid";
    const certificate = cert === "true" ? "goodCert" : "maliciousCert";
    const scriptPath = scriptPaths[mode][certificate];
    if (scriptPath) {
      try {
        const stdin = `${IP} ${port} ${userID} ${key}`;
        const {
          server: { stdout, stderr },
        } = await scriptPath.run();
        res.send({ stdin, stdout, stderr });
      } catch (error) {
        res.send({ error });
      }
    } else {
      res
        .status(501)
        .send(`${cert} certificate for ${mode} mode is not implemented`);
    }
  }
);

app.listen(serverPort, () => {
  console.log(`Crypto Demonstrator server listening on port ${serverPort}.
Using parameters: 
  userID: ${userID}
  key: ${key}
  ip: ${IP}
  port: ${port}
  `);
});
