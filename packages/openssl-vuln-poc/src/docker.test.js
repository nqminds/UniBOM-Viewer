import { afterEach, expect, describe, test } from "@jest/globals";

import { DockerServer } from "./docker.mjs";

const DOCKER_SETUP_TIMEOUT = 10 * 60 * 1000;

// skip tests if running in CI
(process.env.CI ? describe.skip : describe)("DockerServer", () => {
  const dockerServer = new DockerServer({
    // change defaults to avoid conflicts with other DockerServer tests
    name: "nqminds-openssl-vuln-poc-server-docker-test-js",
    port: 2223,
  });
  describe("#pullImage", () => {
    test("should pull (eventually)", async () => {
      // eslint-disable-next-line no-console
      console.info(
        "Pulling Docker image. If this times out, run " +
          '`podman pull "docker.io/aloisklink/cheribuild-edgesec:morello-purecap-20220511"`' +
          "and be prepared to wait for a few hours (10 GiB download)"
      );
      await dockerServer.pullImage();
    });
  });

  describe("setup", () => {
    afterEach(async () => {
      await dockerServer.stop();
    }, 60_000);

    test(
      "should setup process",
      async () => {
        await dockerServer.setup();

        expect(dockerServer.process.exitCode).toBe(null);
      },
      DOCKER_SETUP_TIMEOUT
    );
  });
});
