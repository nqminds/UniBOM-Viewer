import express from "express";
import config from "../config.json" assert { type: "json" };

import scriptPaths from "./script-paths.mjs";

const scriptCache = {
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

const { username, host, port } = config;

api.get(
  "/run-script/:purecap(true|false)/:goodCert(true|false)",
  async (req, res) => {
    const { purecap, goodCert } = req.params;
    const mode = purecap === "true" ? "purecap" : "hybrid";
    const certificate = goodCert === "true" ? "goodCert" : "maliciousCert";
    let ScriptPath = null;
    let scriptPath = scriptCache[mode][certificate];
    if (scriptPath) {
      try {
        const {
          server: { stdin, stdout, stderr },
        } = await scriptPath.run({ port });
        res.send({ stdin, stdout, stderr });
      } catch (error) {
        res.status(500).json(error.message);
      }
    } else {
      ScriptPath = scriptPaths[mode][certificate];
      if (ScriptPath) {
        try {
          const sshOpts = { username, host, port };
          scriptPath = new ScriptPath({ sshOpts });
          await scriptPath.setup({certDirectory: "../openssl-vuln-poc/certs/"});
          scriptCache[mode][certificate] = scriptPath;
          const {
            server: { stdin, stdout, stderr },
          } = await scriptPath.run({ port });
          res.send({ stdin, stdout, stderr });
        } catch (error) {
          res.status(500).json(error.message);
        }
      } else {
        res
          .status(501)
          .json(`${certificate} certificate for ${mode} mode is not implemented`);
      }
    }
  }
);

export default api;
