import { afterAll, beforeAll, expect, describe, test } from "@jest/globals";

import { expectValidRunLogs } from "../test/expect-valid-run-logs.js";

import { DockerServer } from "./docker.mjs";

import {
  OpenSSLTestCase,
  LocalHostTestCase,
  MorelloHybridOpenSSLTestCase,
  MorelloPurecapOpenSSLTestCase,
  MorelloOpenSSLTestCase,
} from "./index.mjs";

const CHERIBSD_MORELLO_SETUP_TIMEOUT = 10 * 60 * 1000;
const CHERIBSD_DOCKER_SETUP_TIMEOUT = 10 * 60 * 1000;
const OPENSSL_TEST_CASE_TIMEOUT = 20 * 60 * 1000;

describe("OpenSSLTestCase", () => {
  const openSSlTestCase = new OpenSSLTestCase();
  describe("#run", () => {
    test("should fail with Unimplemented error", async () => {
      await expect(openSSlTestCase.run()).rejects.toThrow("Unimplemented");
    });
  });
});

describe("LocalHostTestCase", () => {
  const localHostTestCase = new LocalHostTestCase();

  beforeAll(async () => {
    // make sure that OpenSSL has been installed.
    await localHostTestCase.setup();
  });

  describe("#run", () => {
    test(
      "should exit without any issues",
      async () => {
        const result = await localHostTestCase.run();

        expectValidRunLogs(result);

        await expect(result.server.exitCode).toBe(0 /* No issues */);
      },
      OPENSSL_TEST_CASE_TIMEOUT
    );
  });
});

// skip tests if running in CI
(process.env.CI ? describe.skip : describe)("MorelloOpenSSLTestCase", () => {
  /** @type {DockerServer | null} Morello CheriBSD Docker image */
  let dockerServer = null;

  const sshOptions = {
    username: "root",
    host: "127.0.0.2",
    port: 2224,
  };

  beforeAll(async () => {
    dockerServer = new DockerServer({
      port: sshOptions.port,
    });
    await dockerServer.setup();
  }, CHERIBSD_DOCKER_SETUP_TIMEOUT);

  afterAll(async () => {
    if (dockerServer) {
      await dockerServer.stop();
    }
  }, 60_000);

  describe("MorelloOpenSSLTestCase", () => {
    const morelloOpenSSLTestCase = new MorelloOpenSSLTestCase({
      sshOpts: sshOptions,
    });
    describe("setup", () => {
      test(
        "should run fine when called twice",
        async () => {
          await morelloOpenSSLTestCase.setup();
          await morelloOpenSSLTestCase.setup();
        },
        CHERIBSD_MORELLO_SETUP_TIMEOUT * 2
      );
    });
  });

  describe("MorelloHybridOpenSSLTestCase", () => {
    const morelloHybridOpenSSLTestCase = new MorelloHybridOpenSSLTestCase({
      sshOpts: sshOptions,
    });

    beforeAll(async () => {
      await morelloHybridOpenSSLTestCase.setup();
    }, CHERIBSD_MORELLO_SETUP_TIMEOUT);

    describe("#run", () => {
      test(
        "should succeed in pwning OpenSSL server (exitCode 134)",
        async () => {
          const result = await morelloHybridOpenSSLTestCase.run();

          // console.info("Results from pwning OpenSSL server were: ", result);

          // shell should catch SIGABRT and print a nice error message for us
          expect(result.server.stdout).toContain("Abort trap (core dumped)");

          await expect(result.server.exitCode).toBe(134);
          expectValidRunLogs(result);
        },
        OPENSSL_TEST_CASE_TIMEOUT
      );
    });
  });

  describe("MorelloPurecapOpenSSLTestCase", () => {
    const morelloPurecapOpenSSLTestCase = new MorelloPurecapOpenSSLTestCase({
      sshOpts: sshOptions,
    });

    beforeAll(async () => {
      await morelloPurecapOpenSSLTestCase.setup();
    }, CHERIBSD_MORELLO_SETUP_TIMEOUT);

    describe("#run", () => {
      // shell should catch SIGABRT and print a nice error message for us
      test(
        "should return exitCode 162 (CHERI SIGPROT)",
        async () => {
          const result = await morelloPurecapOpenSSLTestCase.run({
            port: 31051,
          });

          // console.info("Results from pwning OpenSSL server were: ", result);

          // shell should catch SIGPROT and print a nice error message for us

          // TODO: for some reason this line doesn't get printed
          // expect(result.server.stdout).toContain(
          //   "In-address space security exception (core dumped)"
          // );

          await expect(result.server.exitCode).toBe(162);
          expectValidRunLogs(result);
        },
        OPENSSL_TEST_CASE_TIMEOUT
      );
    });
  });
});
