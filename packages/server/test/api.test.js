/* eslint-disable jsdoc/valid-types */ // won't work until new version of @nqminds/eslint-config is released
import {
  expect,
  describe,
  test,
  jest,
  beforeEach,
  afterAll,
} from "@jest/globals";

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
      MorelloHybridOpenSSLTestCaseSafeCert: jest.fn().mockImplementation(() => {
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

describe("/run-script/:purecap(true|false)/:goodCert(true|false)", () => {
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

describe("/vulnerability-analysis", () => {
  /** @type {import("node:http").Server} */
  let server;

  beforeEach(async () => {
    jest.unstable_mockModule("@nqminds/vulnerability-analysis", () => ({
      default: jest.fn().mockReturnValue([
        {
          name: "libc6",
          version: "2.34",
          licenses: "",
          cves: [
            {
              id: "CVE-2010-4756",
              description:
                "The glob implementation in the GNU C Library (aka glibc or libc6) allows remote authenticated users to cause a denial of service (CPU and memory consumption) via crafted glob expressions that do not match any pathnames, as demonstrated by glob expressions in STAT commands to an FTP daemon, a different vulnerability than CVE-2010-2632.",
              version: "2.0",
              vectorString: "AV:N/AC:L/Au:S/C:N/I:N/A:P",
              accessVector: "NETWORK",
              accessComplexity: "LOW",
              authentication: "SINGLE",
              confidentialityImpact: "NONE",
              integrityImpact: "NONE",
              availabilityImpact: "PARTIAL",
              baseScore: 4,
              cwes: [{ name: "CWE-399", memoryCwe: false }],
            },
            {
              id: "CVE-2013-4412",
              description:
                "slim has NULL pointer dereference when using crypt() method from glibc 2.17",
              version: "3.1",
              vectorString: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H",
              attackVector: "NETWORK",
              attackComplexity: "LOW",
              privilegesRequired: "NONE",
              userInteraction: "NONE",
              scope: "UNCHANGED",
              confidentialityImpact: "NONE",
              integrityImpact: "NONE",
              availabilityImpact: "HIGH",
              baseScore: 7.5,
              baseSeverity: "HIGH",
              cwes: [{ name: "NULL Pointer Dereference", memoryCwe: true }],
            },
            {
              id: "CVE-2021-38604",
              description:
                "In librt in the GNU C Library (aka glibc) through 2.34, sysdeps/unix/sysv/linux/mq_notify.c mishandles certain NOTIFY_REMOVED data, leading to a NULL pointer dereference. NOTE: this vulnerability was introduced as a side effect of the CVE-2021-33574 fix.",
              version: "3.1",
              vectorString: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H",
              attackVector: "NETWORK",
              attackComplexity: "LOW",
              privilegesRequired: "NONE",
              userInteraction: "NONE",
              scope: "UNCHANGED",
              confidentialityImpact: "NONE",
              integrityImpact: "NONE",
              availabilityImpact: "HIGH",
              baseScore: 7.5,
              baseSeverity: "HIGH",
              cwes: [{ name: "NULL Pointer Dereference", memoryCwe: true }],
            },
            {
              id: "CVE-2021-43396",
              description:
                "** DISPUTED ** In iconvdata/iso-2022-jp-3.c in the GNU C Library (aka glibc) 2.34, remote attackers can force iconv() to emit a spurious '\\0' character via crafted ISO-2022-JP-3 data that is accompanied by an internal state reset. This may affect data integrity in certain iconv() use cases. NOTE: the vendor states \"the bug cannot be invoked through user input and requires iconv to be invoked with a NULL inbuf, which ought to require a separate application bug to do so unintentionally. Hence there's no security impact to the bug.\"",
              version: "3.1",
              vectorString: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N",
              attackVector: "NETWORK",
              attackComplexity: "LOW",
              privilegesRequired: "NONE",
              userInteraction: "NONE",
              scope: "UNCHANGED",
              confidentialityImpact: "NONE",
              integrityImpact: "HIGH",
              availabilityImpact: "NONE",
              baseScore: 7.5,
              baseSeverity: "HIGH",
              cwes: [{ name: "NVD-CWE-noinfo", memoryCwe: false }],
            },
            {
              id: "CVE-2022-23218",
              description:
                "The deprecated compatibility function svcunix_create in the sunrpc module of the GNU C Library (aka glibc) through 2.34 copies its path argument on the stack without validating its length, which may result in a buffer overflow, potentially resulting in a denial of service or (if an application is not built with a stack protector enabled) arbitrary code execution.",
              version: "3.1",
              vectorString: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
              attackVector: "NETWORK",
              attackComplexity: "LOW",
              privilegesRequired: "NONE",
              userInteraction: "NONE",
              scope: "UNCHANGED",
              confidentialityImpact: "HIGH",
              integrityImpact: "HIGH",
              availabilityImpact: "HIGH",
              baseScore: 9.8,
              baseSeverity: "CRITICAL",
              cwes: [
                {
                  name: "Buffer Copy without Checking Size of Input ('Classic Buffer Overflow')",
                  memoryCwe: true,
                },
              ],
            },
            {
              id: "CVE-2022-23219",
              description:
                "The deprecated compatibility function clnt_create in the sunrpc module of the GNU C Library (aka glibc) through 2.34 copies its hostname argument on the stack without validating its length, which may result in a buffer overflow, potentially resulting in a denial of service or (if an application is not built with a stack protector enabled) arbitrary code execution.",
              version: "3.1",
              vectorString: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
              attackVector: "NETWORK",
              attackComplexity: "LOW",
              privilegesRequired: "NONE",
              userInteraction: "NONE",
              scope: "UNCHANGED",
              confidentialityImpact: "HIGH",
              integrityImpact: "HIGH",
              availabilityImpact: "HIGH",
              baseScore: 9.8,
              baseSeverity: "CRITICAL",
              cwes: [
                {
                  name: "Buffer Copy without Checking Size of Input ('Classic Buffer Overflow')",
                  memoryCwe: true,
                },
              ],
            },
            {
              id: "CVE-2021-3998",
              description:
                "A flaw was found in glibc. The realpath() function can mistakenly return an unexpected value, potentially leading to information leakage and disclosure of sensitive data.",
              version: "3.1",
              vectorString: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N",
              attackVector: "NETWORK",
              attackComplexity: "LOW",
              privilegesRequired: "NONE",
              userInteraction: "NONE",
              scope: "UNCHANGED",
              confidentialityImpact: "HIGH",
              integrityImpact: "NONE",
              availabilityImpact: "NONE",
              baseScore: 7.5,
              baseSeverity: "HIGH",
              cwes: [
                { name: "Out-of-bounds Read", memoryCwe: true },
                { name: "Unchecked Return Value", memoryCwe: true },
              ],
            },
          ],
        },
      ]),
    }));
    const { default: api } = await import("../src/api.mjs");

    const app = express();
    app.use(api);

    server = createServer(app);
    await promisify(server.listen).call(server, 0, "127.0.0.1");
  });

  afterAll(async () => {
    await promisify(server.close).call(server);
  });

  test("should return valid data", async () => {
    const { port, address } = server.address();

    const nqmCyberApi = new NqmCyberAPI({ BASE: `http://${address}:${port}` });

    // TODO, check if this works with the real data, not just mocked data
    const vulnAnalysisArray = await nqmCyberApi.default.vulnerabilityAnalysis();

    for (const component of vulnAnalysisArray) {
      expect(component).toEqual(
        expect.objectContaining({
          name: expect.any(String),
          version: expect.any(String),
          licenses: expect.any(String),
          cves: expect.any(Array),
        })
      );

      for (const cve of component.cves) {
        expect(cve).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            // name: expect.any(String),
            description: expect.any(String),
            cwes: expect.any(Array),
            baseScore: expect.any(Number),
            version: expect.stringMatching(/(2\.0)|(3\.1)/),
            vectorString: expect.any(String),
          })
        );

        if (cve.version === "3.1") {
          expect(cve).toHaveProperty("baseSeverity");
        }

        for (const cwe of cve.cwes) {
          expect(cwe).toEqual(
            expect.objectContaining({
              name: expect.any(String),
              memoryCwe: expect.any(Boolean),
            })
          );
        }
      }
    }
  });
});
