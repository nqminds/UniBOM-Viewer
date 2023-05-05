/* eslint-disable jsdoc/valid-types */ // won't work until new version of @nqminds/eslint-config is released
import { expect, describe, test, jest } from "@jest/globals";

import { setTimeout } from "node:timers/promises";
import { promisify } from "node:util";
import { createServer } from "node:http";

import { NqmCyberAPI } from "@nqminds/cyber-demonstrator-client";
import express from "express";

function checkLength(item) {
  if (item && item.length) {
    return item.length;
  }
  return 0;
}

/**
 * Runs the api on a temporary server, then calls `runScript` with the `args`.
 *
 * @param {mport("../src/api.mjs")["default"]} api - Server API.
 * @param {Parameters<NqmCyberAPI["default"]["runScript"]>} args - Args to pass
 * to Morello RunScript API route.
 * @returns {ReturnType<NqmCyberAPI["default"]["runScript"]>>} `runScript` results,
 * or rejects with an `ApiError` if there's an error.
 */
async function get(api, ...args) {
  const app = express();
  app.use(api);

  const server = createServer(app);
  try {
    await promisify(server.listen).call(server, 0, "127.0.0.1");
    const { port, address } = server.address();

    const nqmCyberApi = new NqmCyberAPI({ BASE: `http://${address}:${port}` });
    return await nqmCyberApi.default.runScript(...args);
  } finally {
    await promisify(server.close).call(server);
  }
}

/**
 * Send a request to all known working API routes.
 *
 * @param {import("../src/api.mjs")["default"]} api - The express API.
 * @returns {Promise<ReturnType<NqmCyberAPI["default"]["runScript"]>[]>} runScript results.
 */
function getAllGoodRequests(api) {
  return [
    get(api, true, true),
    get(api, true, false),
    get(api, false, true),
    get(api, false, false),
  ];
}

describe("/run-script/:purecap(true|false)/:goodCert(true|false)", () => {
  /**
   * @type {jest.Mocked<import("@nqminds/openssl-vuln-poc").MorelloOpenSSLTestCase>}
   *
   * Mocked `MorelloOpenSSLTestCase` that returns some dummy data.
   *
   * Important, `mockedOpenSSLTestCase instanceof MorelloOpenSSLTestCase` must
   * return `true`.
   */
  let mockedOpenSSLTestCase = null;

  class MorelloOpenSSLTestCase {
    constructor() {
      // returns a singleton (this is some JavaScript magic)
      if (mockedOpenSSLTestCase === null) {
        mockedOpenSSLTestCase = this; // eslint-disable-line consistent-this
      }
      this.setup = jest.fn().mockReturnValue(Promise.resolve());
      return mockedOpenSSLTestCase;
    }
  }

  beforeEach(async () => {
    // make sure that `instanceof MorelloOpenSSLTestCase` works.
    mockedOpenSSLTestCase = null;
    new MorelloOpenSSLTestCase();
    mockedOpenSSLTestCase.run = jest.fn().mockReturnValue({
      client: {
        stdin: "client stdin",
        stdout: "client stdout",
        stderr: "client stderr",
      },
      server: {
        stdin: "server stdin",
        stdout: "server stdout",
        stderr: "server stderr",
        exitCode: 0,
      },
    });

    const opensslVulnPocMockImplementation = () => {
      return {
        MorelloOpenSSLTestCase,
        MorelloPurecapOpenSSLTestCase: jest.fn().mockImplementation(() => {
          return mockedOpenSSLTestCase;
        }),
        MorelloHybridOpenSSLTestCase: jest.fn().mockImplementation(() => {
          return mockedOpenSSLTestCase;
        }),
        LocalHostTestCase: jest.fn().mockImplementation(() => {
          return mockedOpenSSLTestCase;
        }),
        MorelloHybridOpenSSLTestCaseSafeCert: jest
          .fn()
          .mockImplementation(() => {
            return mockedOpenSSLTestCase;
          }),
        MorelloPurecapOpenSSLTestCaseSafeCert: jest
          .fn()
          .mockImplementation(() => {
            return mockedOpenSSLTestCase;
          }),
      };
    };

    jest.unstable_mockModule(
      "@nqminds/openssl-vuln-poc",
      opensslVulnPocMockImplementation
    );
    // we're mocking the mocks, so that all the constructors return the same value
    jest.unstable_mockModule(
      "@nqminds/openssl-vuln-poc/src/__mocks__/index.mjs",
      opensslVulnPocMockImplementation
    );
  });

  afterEach(() => {
    // restore replaced property
    jest.restoreAllMocks();
    jest.resetModules();
  });

  test("should return stdin string value", async () => {
    const { default: api } = await import("../src/api.mjs");
    const requests = await Promise.all(getAllGoodRequests(api));
    requests.forEach((res) => {
      expect(res).toHaveProperty("stdin");
      expect(res.stdin.length).not.toEqual(0);
      expect(typeof res.stdin).toEqual("string");
    });
  });
  test("should return stdout And/Or stderr", async () => {
    const { default: api } = await import("../src/api.mjs");
    const requests = await Promise.all(getAllGoodRequests(api));
    requests.forEach((res) => {
      expect([res.stdout, res.stderr]).not.toEqual([undefined, undefined]);
      expect([checkLength(res.stdout), checkLength(res.stderr)]).not.toEqual([
        0, 0,
      ]);
    });
  });
  test("stdout should have value string", async () => {
    const { default: api } = await import("../src/api.mjs");
    const requests = await Promise.all(getAllGoodRequests(api));
    requests.forEach((res) => {
      expect(typeof res.stdout).toEqual("string");
    });
  });
  test("stderr should have value string", async () => {
    const { default: api } = await import("../src/api.mjs");
    const requests = await Promise.all(getAllGoodRequests(api));
    requests.forEach((res) => {
      expect(typeof res.stderr).toEqual("string");
    });
  });
  test("should respond with 500 if unexpected error occurs", async () => {
    jest.spyOn(mockedOpenSSLTestCase, "run").mockImplementation(() => {
      throw new Error("Unexpected error!");
    });
    const { default: api } = await import("../src/api.mjs");

    expect.assertions(1);
    try {
      await get(api, true, false);
    } catch (error) {
      expect(error.status).toEqual(500);
    }
  });

  test("should respond with a 503 if the server is still settting up", async () => {
    const abortSetup = new AbortController();
    jest.spyOn(mockedOpenSSLTestCase, "setup").mockImplementation(() => {
      return setTimeout(3000, null, { signal: abortSetup.signal });
    });

    // wait a bit for event loop to run
    await setTimeout(1);

    expect.assertions(4);

    const { default: api } = await import("../src/api.mjs");
    try {
      await get(api, true, false);
    } catch (error) {
      expect(error.status).toEqual(503);
      expect(error.body).toContain("Morello Server is still setting up");
    }

    abortSetup.abort("Testing setup() failure");
    try {
      await get(api, true, false);
    } catch (error) {
      expect(error.status).toEqual(500);
      expect(error.body).toContain("Setting up the Morello Server failed");
    }
  });

  test("should return error message if unexpected error", async () => {
    const message = "HELP an error occured!";
    jest.spyOn(mockedOpenSSLTestCase, "run").mockImplementation(() => {
      throw new Error(message);
    });
    const { default: api } = await import("../src/api.mjs");

    try {
      await get(api, true, false);
    } catch (error) {
      expect(error.status).toEqual(500);
      expect(error.body).toEqual(message);
    }
  });
  test("should respond with 501 if incorrect config", async () => {
    jest.unstable_mockModule("../src/test-cases.mjs", () => {
      return {
        default: {
          purecap: {
            goodCert: null,
            maliciousCert: null,
          },
        },
      };
    });
    const { default: api } = await import("../src/api.mjs");

    try {
      await get(api, true, false);
    } catch (error) {
      expect(error.status).toEqual(501);
    }
  });
  test("should return error message if incorrect config", async () => {
    jest.unstable_mockModule("../src/test-cases.mjs", () => {
      return {
        default: {
          purecap: {
            goodCert: null,
            maliciousCert: null,
          },
          hybrid: {
            goodCert: null,
            maliciousCert: null,
          },
        },
      };
    });
    const { default: api } = await import("../src/api.mjs");

    expect.assertions(4);
    try {
      await get(api, true, true);
    } catch (error) {
      expect(error.body).toEqual(
        "goodCert certificate for purecap mode is not implemented"
      );
    }

    try {
      await get(api, true, false);
    } catch (error) {
      expect(error.body).toEqual(
        "maliciousCert certificate for purecap mode is not implemented"
      );
    }

    try {
      await get(api, false, true);
    } catch (error) {
      expect(error.body).toEqual(
        "goodCert certificate for hybrid mode is not implemented"
      );
    }

    try {
      await get(api, false, false);
    } catch (error) {
      expect(error.body).toEqual(
        "maliciousCert certificate for hybrid mode is not implemented"
      );
    }
  });
});
