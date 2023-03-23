/* eslint-disable */
import express from "express";
import { promisify } from "util";
import { exec as execRaw } from "child_process";
import config from "./config.json" assert { type: "json" };

const exec = promisify(execRaw);

const app = express();
const serverPort = 3000;

const { userID, key, IP, port, scriptPath } = config;

console.log(userID, key, IP, port);

// we'll either want 4 api routes, one for each permutation
// or 2 parameters (purecap/hybrid and good/malicious cert) and run the appropriate script for each
app.get("/run-script", async (req, res) => {
  let [stdout, stderr, error] = ["", "", ""];
  try {
    ({ stdout, stderr } = await exec(
      `${scriptPath} ${IP} ${port} ${userID} ${key}`
    ));
  } catch (err) {
    error = err.message;
  }
  res.send({ stdout, stderr, error });
});

app.listen(serverPort, () => {
  console.log(`Crypto Demonstrator server listening on port ${serverPort}.
Using parameters: 
  userID: ${userID}
  key: ${key}
  ip: ${IP}
  port: ${port}
  `);
});
