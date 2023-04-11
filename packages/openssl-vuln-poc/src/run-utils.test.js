import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { afterAll, expect, describe, jest, test } from "@jest/globals";

import { expectValidRunLogs } from "../test/expect-valid-run-logs.js";

/**
 * Tests that the `runTest` command works fine for every combination of
 * OpenSSL Client/Server failing.
 */
describe("runTest", () => {
  afterAll(jest.resetModules);

  const serverStartFailure = [
    "sh",
    "-c",
    ">&2 echo 'severStartFailure' && exit 2",
  ];
  const serverRun = [
    "sh",
    "-c",
    "sleep 3s && echo 'staying alive' && sleep 60s",
  ];
  const serverAbortFailure = [
    "sh",
    "-c",
    "sleep 3s && >&2 echo 'aborting' && exit 134",
  ];

  const clientSuccess = [
    "bash",
    "-c",
    "cat - <(echo 'Mocked successful client')",
  ];
  const clientFailure = [
    "bash",
    "-c",
    "cat - <(echo 'Mocked successful client') && exit 1",
  ];

  test.each`
    clientCmdMock    | serverCmdMock         | error
    ${clientSuccess} | ${serverRun}          | ${null}
    ${clientFailure} | ${serverRun}          | ${null /* ignore client error "Client OpenSSL cmd failed"*/}
    ${clientSuccess} | ${serverStartFailure} | ${"Launching OpenSSL server process failed!"}
    ${clientFailure} | ${serverStartFailure} | ${"Launching OpenSSL server process failed!"}
    ${clientSuccess} | ${serverAbortFailure} | ${null}
    ${clientFailure} | ${serverAbortFailure} | ${null /* ignore client error "Client OpenSSL cmd failed"*/}
  `(
    "clientCmd: $clientCmdMock, serverCmd: $serverCmdMock})",
    async ({ clientCmdMock, serverCmdMock, error }) => {
      jest.resetModules();
      jest.unstable_mockModule("./ssh-utils.mjs", () => {
        return {
          runViaSSH: jest.fn((command, _sshOpts, childProcessOpts) => {
            expect(_sshOpts.host).toBe("mocked-host.invalid");
            switch (command[1]) {
              case "s_server":
                return promisify(execFile)(
                  serverCmdMock[0],
                  serverCmdMock.slice(1),
                  childProcessOpts
                );
              case "s_client":
                return promisify(execFile)(
                  clientCmdMock[0],
                  clientCmdMock.slice(1),
                  childProcessOpts
                );
              default:
                throw new Error(`Missing jest mock for ${command}`);
            }
          }),
          DEFAULT_SSH_CLI_OPTIONS: [],
        };
      });

      const { runTest } = await import("./run-utils.mjs");

      const promise = runTest({
        sshOpts: { host: "mocked-host.invalid" },
        port: 12345,
      });

      if (error) {
        await expect(promise).rejects.toThrow(error);
      } else {
        const runLogs = await promise;
        expectValidRunLogs(runLogs);
      }
    },
    7000
  );
});
