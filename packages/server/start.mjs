/* eslint-disable no-console */
import express from "express";
import config from "./config.json" assert { type: "json" };

const { httpServerPort, username, key, host, sshPort } = config;
import api from "./src/api.mjs";

const app = express();

app.use(api);

app.listen(httpServerPort, () => {
  console.log(`Crypto Demonstrator server listening on port ${httpServerPort}.
Using parameters: 
  username: ${username}
  key: ${key}
  host: ${host}
  ssh port: ${sshPort}
  `);
});
