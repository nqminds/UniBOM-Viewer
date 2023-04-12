/* eslint-disable no-console */
import express from "express";
import config from "./config.json" assert { type: "json" };

const { serverPort, username, key, host, port } = config;
import api from "./src/api.mjs";

const app = express();

app.use(api);

app.listen(serverPort, () => {
  console.log(`Crypto Demonstrator server listening on port ${serverPort}.
Using parameters: 
  username: ${username}
  key: ${key}
  host: ${host}
  port: ${port}
  `);
});
