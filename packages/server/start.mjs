/* eslint-disable no-console */
import express from "express";
import config from "./config.json" assert { type: "json" };

const { serverPort, userID, key, IP, port } = config;
import api from "./src/api.mjs";

const app = express();

app.use(api);

app.listen(serverPort, () => {
  console.log(`Crypto Demonstrator server listening on port ${serverPort}.
Using parameters: 
  userID: ${userID}
  key: ${key}
  ip: ${IP}
  port: ${port}
  `);
});
