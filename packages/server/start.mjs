/* eslint-disable no-console */
import express from "express";
import config from "./config.json" assert { type: "json" };

const { httpServerPort } = config;
import api from "./src/api.mjs";

const app = express();

app.use(api);

app.listen(httpServerPort, () => {
  console.log(`Server listening on port ${httpServerPort}.`);
});
