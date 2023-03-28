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
  "/run-script/:purecap(true|false)/:cert(good|malicious)",
  async (req, res) => {
    const { purecap, cert } = req.params;
    const mode = purecap === "true" ? "purecap" : "hybrid"; // eslint-disable-line no-unused-vars
    const certificate = cert === "malicious" ? "maliciousCert" : "goodCert"; // eslint-disable-line no-unused-vars
    let [stdout, stderr, error] = ["", "", ""];
    const scriptPath = scriptPaths[mode][certificate];
    if (scriptPath) {
      try {
        ({
          server: { stdout, stderr },
        } = await scriptPath.run());
      } catch (err) {
        error = err.message;
      }
      res.send({ stdout, stderr, error });
    } else {
      res
        .status(400)
        .send(`${cert} certificate for mode ${mode} is not implemented`);
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
