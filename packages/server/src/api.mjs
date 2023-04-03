import express from "express";
import config from "../config.json" assert { type: "json" };

import scriptPaths from "./script-paths.mjs";

const api = express();

const { userID, key, IP, port } = config;

api.get(
  "/run-script/:purecap(true|false)/:goodCert(true|false)",
  async (req, res) => {
    const { purecap, goodCert } = req.params;
    const mode = purecap === "true" ? "purecap" : "hybrid";
    const certificate = goodCert === "true" ? "goodCert" : "maliciousCert";
    const scriptPath = scriptPaths[mode][certificate];
    if (scriptPath) {
      try {
        const stdin = `${IP} ${port} ${userID} ${key}`;
        const {
          server: { stdout, stderr },
        } = await scriptPath.run();
        res.send({ stdin, stdout, stderr });
      } catch (error) {
        res.status(500).send(error.message);
      }
    } else {
      res
        .status(501)
        .send(`${certificate} certificate for ${mode} mode is not implemented`);
    }
  }
);

export default api;
