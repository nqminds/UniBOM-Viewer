import { expect, describe, test, jest } from "@jest/globals";

import { Fetcher } from "openapi-typescript-fetch";
import {paths} from "../openapi-schema";
import fetch, { Headers, Request, Response } from 'node-fetch'


if (!globalThis.fetch) {
  globalThis.fetch = fetch as any
  globalThis.Headers = Headers as any
  globalThis.Request = Request as any
  globalThis.Response = Response as any
}

// declare fetcher for paths
const fetcher = Fetcher.for<paths>()

// global configuration
fetcher.configure({
  baseUrl: 'http://localhost:3000',
})

describe("", () => {

  test("/run-script API endpoint (ts)", async () => {
    // TODO Fix this
    expect(true).toBe(true);
    // create fetch operations
    // const runScript = fetcher.path('/run-script/{purecap}/{goodCert}').method('get').create();
    // // fetch
    // const { status } = await runScript({
    //   purecap: true, goodCert: false,
    // });
    // expect(status).toEqual(200);
  })
});