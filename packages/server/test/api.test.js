/* eslint-disable jsdoc/valid-types */ // won't work until new version of @nqminds/eslint-config is released
import { expect, describe, test, jest } from "@jest/globals";

import { setTimeout } from "node:timers/promises";

import request from "supertest";

function checkLength(item) {
  if (item && item.length) {
    return item.length;
  }
  return 0;
}

/**
 * Send a request to all known working API routes.
 *
 * @param {import("../src/api.mjs")["default"]} api - The express API.
 * @returns {Promise<void>} Resolves on success.
 */
function getAllGoodRequests(api) {
  return [
    request(api).get("/run-script/true/true"),
    request(api).get("/run-script/true/false"),
    request(api).get("/run-script/false/true"),
    request(api).get("/run-script/false/false"),
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

  test("should respond with 200", async () => {
    const { default: api } = await import("../src/api.mjs");
    const requests = await Promise.all(getAllGoodRequests(api));
    requests.forEach((res) => expect(res.statusCode).toEqual(200));
  });
  test("should return stdin string value", async () => {
    const { default: api } = await import("../src/api.mjs");
    const requests = await Promise.all(getAllGoodRequests(api));
    requests.forEach((res) => {
      expect(res.body).toHaveProperty("stdin");
      expect(res.body.stdin.length).not.toEqual(0);
      expect(typeof res.body.stdin).toEqual("string");
    });
  });
  test("should return stdout And/Or stderr", async () => {
    const { default: api } = await import("../src/api.mjs");
    const requests = await Promise.all(getAllGoodRequests(api));
    requests.forEach((res) => {
      expect([res.body.stdout, res.body.stderr]).not.toEqual([
        undefined,
        undefined,
      ]);
      expect([
        checkLength(res.body.stdout),
        checkLength(res.body.stderr),
      ]).not.toEqual([0, 0]);
    });
  });
  test("stdout should have value string", async () => {
    const { default: api } = await import("../src/api.mjs");
    const requests = await Promise.all(getAllGoodRequests(api));
    requests.forEach((res) => {
      if (res.stdout) {
        expect(typeof res.stdout).toEqual("string");
      }
    });
  });
  test("stderr should have value string", async () => {
    const { default: api } = await import("../src/api.mjs");
    const requests = await Promise.all(getAllGoodRequests(api));
    requests.forEach((res) => {
      if (res.stderr) {
        expect(typeof res.stdout).toEqual("string");
      }
    });
  });
  test("should respond with 500 if unexpected error occurs", async () => {
    jest.spyOn(mockedOpenSSLTestCase, "run").mockImplementation(() => {
      throw new Error("Unexpected error!");
    });
    const { default: api } = await import("../src/api.mjs");
    const response = await request(api).get("/run-script/true/false");
    expect(response.statusCode).toEqual(500);
  });

  test("should respond with a 503 if the server is still settting up", async () => {
    const abortSetup = new AbortController();
    jest.spyOn(mockedOpenSSLTestCase, "setup").mockImplementation(() => {
      return setTimeout(3000, null, { signal: abortSetup.signal });
    });

    // wait a bit for event loop to run
    await setTimeout(1);

    const { default: api } = await import("../src/api.mjs");
    const response503 = await request(api).get("/run-script/true/false");
    expect(response503.statusCode).toEqual(503);
    expect(response503.error.text).toContain(
      "Morello Server is still setting up"
    );

    abortSetup.abort("Testing setup() failure");
    const response500 = await request(api).get("/run-script/true/false");
    expect(response500.statusCode).toEqual(500);
    expect(response500.error.text).toContain(
      "Setting up the Morello Server failed"
    );
  });

  test("should return error message if unexpected error", async () => {
    const message = "HELP an error occured!";
    jest.spyOn(mockedOpenSSLTestCase, "run").mockImplementation(() => {
      throw new Error(message);
    });
    const { default: api } = await import("../src/api.mjs");
    const response = await request(api).get("/run-script/true/false");
    expect(response.error.text).toEqual(`"${message}"`);
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
    const response = await request(api).get("/run-script/true/false");
    expect(response.statusCode).toEqual(501);
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

    const response_purecap_good = await request(api).get(
      "/run-script/true/true"
    );
    expect(response_purecap_good.error.text).toEqual(
      '"goodCert certificate for purecap mode is not implemented"'
    );

    const response_purecap_bad = await request(api).get(
      "/run-script/true/false"
    );
    expect(response_purecap_bad.error.text).toEqual(
      '"maliciousCert certificate for purecap mode is not implemented"'
    );

    const response_hybrid_good = await request(api).get(
      "/run-script/false/true"
    );
    expect(response_hybrid_good.error.text).toEqual(
      '"goodCert certificate for hybrid mode is not implemented"'
    );

    const response_hybrid_bad = await request(api).get(
      "/run-script/false/false"
    );
    expect(response_hybrid_bad.error.text).toEqual(
      '"maliciousCert certificate for hybrid mode is not implemented"'
    );
  });
});
