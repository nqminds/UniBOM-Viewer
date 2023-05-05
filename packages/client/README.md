# @nqminds/cyber-demonstrator-client

OpenAPI client for the `@nqminds/cyber-demonstrator-server`.

Automatically generated from [`./openapi.yml`](./openapi.yml).

## Usage

```js
import { NqmCyberAPI } from "@nqminds/cyber-demonstrator-client";

const nqmCyberApi = new NqmCyberAPI({ BASE: `http://${address}:${port}` });

const [purecap, goodCert] = [true, true];
try {
  const { stdout } = await nqmCyberApi.default.runScript(purecap, goodCert);
} catch (error) {
  console.error(`Got error ${error} with body ${error.body}`);
}
```
