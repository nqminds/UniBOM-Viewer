/* eslint-disable no-console */
import express from "express";
import { promises as fs } from "fs";
import path from "path";
import api from "./src/api.mjs";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const configContent = await fs.readFile(
  path.join(__dirname, "config.json"),
  "utf-8"
);
const config = JSON.parse(configContent);

const { httpServerPort } = config;

const app = express();

app.use(api);

app.listen(httpServerPort, () => {
  console.log(`Server listening on port ${httpServerPort}.`);
});
