import express from "express";
import { promisify } from "util";
import { exec as execRaw } from "child_process";
import config from "./config.json" assert { type: "json" };

const exec = promisify(execRaw);

const app = express();

const { serverPort, userID, key, IP, port, scriptPaths } = config;

app.get(
  "/run-script/:purecap(true|false)/:cert(good|malicious)",
  async (req, res) => {
    const { purecap, cert } = req.params;
    const mode = purecap === "true" ? "purecap" : "hybrid";
    const certificate = cert === "malicious" ? "maliciousCert" : "goodCert";
    let [stdout, stderr, error] = ["", "", ""];
    try {
      const scriptPath = scriptPaths[mode][certificate];
      ({ stdout, stderr } = await exec(
        `${scriptPath} ${IP} ${port} ${userID} ${key}`
      ));
    } catch (err) {
      error = err.message;
    }
    res.send({ stdout, stderr, error });
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
