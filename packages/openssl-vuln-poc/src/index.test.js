import {expect, describe, test} from '@jest/globals';

import {
  OpenSSLTestCase,
  LocalHostTestCase,
  MorelloHybridOpenSSLTestCase,
  MorelloPurecapOpenSSLTestCase,
} from "./index.mjs";

/**
 * Asserts that the given object is a valid {@link RunLogs} object.
 *
 * @param {import("./index.mjs").RunLogs} runLogsObj - The object to check.
 */
function expectValidRunLogs(runLogsObj) {
  return expect(runLogsObj).toEqual(
    expect.objectContaining({
      client: expect.objectContaining({
        stdout: expect.any(String),
        stderr: expect.any(String),
      }),
      server: expect.objectContaining({
        stdout: expect.any(String),
        stderr: expect.any(String),
        exitCode: expect.any(Number),
      }),
    })
  );
}

describe("OpenSSLTestCase", () => {
  describe("#run", () => {
    test("should fail with Unimplemented error", async () => {
      await expect(OpenSSLTestCase.run()).rejects.toThrow("Unimplemented");
    });
  });
});

describe("LocalHostTestCase", () => {
  describe("#run", () => {
    test("should be killed by SIGINT after timeout due to safe OpenSSL lib", async () => {
      const result = await LocalHostTestCase.run();

      expectValidRunLogs(result);

      await expect(result.server.exitCode).toBe(0x82 /* killed by SIGINT */);
    }, 30_000); // 30 second timeout
  });
});

describe("MorelloHybridOpenSSLTestCase", () => {
  describe("#run", () => {
    test("should succeed in pwning OpenSSL server", async () => {
      const result = await MorelloHybridOpenSSLTestCase.run();

      await expect(result.server.exitCode).toBe(0);
      expectValidRunLogs(result);
    });
  });
});

describe("MorelloPurecapOpenSSLTestCase", () => {
  describe("#run", () => {
    test("should return failing exitCode", async () => {
      const result = await MorelloPurecapOpenSSLTestCase.run();

      await expect(result.server.exitCode).not.toBe(0);
      expectValidRunLogs(result);
    });
  });
});
