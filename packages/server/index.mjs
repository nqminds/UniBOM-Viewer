import express from "express";
import { promisify, parseArgs } from "util";
import { exec as execRaw } from "child_process";
const exec = promisify(execRaw).exec;

const app = express();
const serverPort = 3000;

const cmdLineOptions = {
  userID: {
    type: "string",
    default: "me",
  },
  key: {
    type: "string",
    default: "my-ssh-key",
  },
  ip: {
    type: "string",
    default: "192.168.0.1",
  },
  port: {
    type: "string",
    default: "4001",
  },
};

const { values } = parseArgs({ options: cmdLineOptions });

const userID = values.userID ?? cmdLineOptions.userID.default;
const key = values.key ?? cmdLineOptions.key.default;
const IP = values.ip ?? cmdLineOptions.ip.default;
const port = values.port ?? cmdLineOptions.port.default;

console.log(userID, key, IP, port);

// we'll either want 4 api routes, one for each permutation
// or 2 parameters (purecap/hybrid and good/malicious cert) and run the appropriate script for each
app.get("/run-script", async (req, res) => {
  let [stdout, stderr, error] = ["", "", ""];
  try {
    ({ stdout, stderr } = await exec(
      `./test.sh ${IP} ${port} ${userID} ${key}`
    ));
  } catch (err) {
    error = err;
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
