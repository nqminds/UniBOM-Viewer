/* eslint-disable no-console */

import config from "./config.json" assert { type: "json" };

const { serverPort, userID, key, IP, port } = config;
import api from "./src/api.mjs";

api.listen(serverPort, () => {
  console.log(`Crypto Demonstrator server listening on port ${serverPort}.
Using parameters: 
  userID: ${userID}
  key: ${key}
  ip: ${IP}
  port: ${port}
  `);
});
