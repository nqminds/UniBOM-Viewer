// eslint-disable no-console
import { execFile } from "node:child_process";
import { Readable } from "node:stream";
import { promisify } from "node:util";

/**
 * @typedef {import("./ssh-utils.mjs").SSHOpts} SSHOpts
 */

/**
 * @typedef {object} RunLogs Result from a {@link OpenSSLTestCase} run.
 * @property {object} client - OpenSSL client logs.
 * @property {string} client.stdout - OpenSSL client stdout output.
 * @property {string} client.stderr - OpenSSL client stderr output.
 * @property {object} server - OpenSSL server logs.
 * @property {string} server.stdout - OpenSSL server stdout output.
 * @property {string} server.stderr - OpenSSL server stderr output.
 * @property {import("node:child_process").ChildProcess.exitCode} server.exitCode -
 * If set, the exit code of the process.
 */

/**
 * @typedef {import("node:child_process").ExecFileException & {
 * stdout: string, stderr: string,
 * }} PromisifiedExecFileException The error that is thrown if `promisify(execFile)` rejects.
 */

/**
 * Runs an OpenSSL test case.
 *
 * 1. Starts an OpenSSL server.
 * 2. Start a malicious OpenSSL client and connect to the server.
 * 3. Wait for client to exit.
 * 4. After waiting for `timeout` milliseconds:
 * -    1. If server dies, stop client, then return logs.
 * -    2. If server is still alive after a few seconds, then it's not vulnerable to
 * -       the exploit. In that case, kill client and server and return logs.
 *
 * @param {object} [opts] - Optional options.
 * @param {string} [opts.clientOpensslBinary] - The openssl CLI binary to use for the client.
 * @param {string} [opts.serverOpensslBinary] - The openssl CLI binary to use for the server.
 * @param {SSHOpts} [opts.sshOpts] - If set, SSH to the given host, and run the
 * test there.
 * @param {number} [opts.port] - The port to use for the OpenSSL test.
 * @returns {Promise<RunLogs>} Resolves when the processes are closed with the logs of the process.
 */
export async function runTest({
  clientOpensslBinary = "openssl",
  serverOpensslBinary = "openssl",
  sshOpts = null,
  port = 31050,
} = {}) {
  // use dynamic import so that jest can mock this function in our test code
  const { runViaSSH: dynamicallyImportedRunViaSSH } = await import(
    "./ssh-utils.mjs"
  );

  /**
   * @type {(
   * cmd: string[],
   * opts: import("node:child_process").ExecFileOptionsWithStringEncoding,
   * ) => import("node:child_process").PromiseWithChild<{stdout: string, stderr: string}>}
   * Runs the given command, either via SSH or on the local machine.
   */
  let execFileFunc;
  if (sshOpts) {
    execFileFunc = (command, opts) => {
      return dynamicallyImportedRunViaSSH(command, sshOpts, { ...opts });
    };
  } else {
    execFileFunc = (command, opts) =>
      promisify(execFile)(command[0], command.slice(1), opts);
  }

  const abortController = new AbortController();
  try {
    console.info(`Running OpenSSL server on port ${port}`); // eslint-disable-line no-console

    const serverStdIn = [
      serverOpensslBinary,
      "s_server",
      "-accept",
      port,
      "-CAfile",
      "certs/cacert.pem",
      "-cert",
      "certs/server.cert.pem",
      "-key",
      "certs/server.key.pem",
      "-state",
      "-verify",
      1,
    ];
    const serverProcess = execFileFunc(serverStdIn, {
      signal: abortController.signal,
      killSignal: "SIGINT",
    });

    try {
      // wait for OpenSSL server to start listening
      await Promise.race([promisify(setTimeout)(3000), serverProcess]);
    } catch (error) {
      throw new Error("Launching OpenSSL server process failed!", {
        cause: error,
      });
    }

    console.info(`Running OpenSSL malicious client payload on port ${port}`); // eslint-disable-line no-console

    const clientStdIn = [
      clientOpensslBinary,
      "s_client",
      "-connect",
      `127.0.0.1:${port}`,
      "-key",
      "certs/client.key.pem",
      "-cert",
      "certs/client.cert.pem",
      "-CAfile",
      "certs/malicious-client-cacert.pem",
      "-state",
    ];
    const clientProcess = execFileFunc(clientStdIn);

    clientProcess.child.on("spawn", () => {
      Readable.from("Hello World from my OpenSSL Client!").pipe(
        clientProcess.child.stdin
      );
    });

    try {
      await serverProcess;
      await promisify(setTimeout)(1000);
      abortController.abort("Aborting OpenSSL client as OpenSSL server closed");
    } catch (error) {
      await promisify(setTimeout)(1000);
      abortController.abort(
        `Aborting OpenSSL client as OpenSSL server exited due to ${error}`
      );
      // Handle error here
      console.error("Error:", error); // eslint-disable-line no-console
    }

    /** @type {RunLogs["client"] | undefined} */
    let clientOutput;
    try {
      // TODO: should we throw an error if the client OpenSSL process exits
      // without being killed/aborted?
      clientOutput = await clientProcess;
    } catch (error) {
      const execFileError = /** @type {PromisifiedExecFileException} */ (error);
      if (execFileError.code !== "ABORT_ERR") {
        // TODO: assuming this happens rarely, we should probably be throwing an error
        console.warn(
          // eslint-disable-line no-console
          // eslint-disable-line no-console
          `
          Client OpenSSL cmd failed with error code ${execFileError.code}. ` +
            `Stderr was ${execFileError.stderr}.\n` +
            `Stdout was ${execFileError.stdout}.`
        );
      }

      clientOutput = {
        stdin: clientStdIn.join(", "),
        stdout: execFileError.stdout,
        stderr: execFileError.stderr,
      };
    }

    abortController.abort(
      "Client OpenSSL process is done, killing OpenSSL Server"
    );

    /** @type {RunLogs["server"] | undefined} */
    let serverOutput;
    try {
      serverOutput = await serverProcess;
    } catch (error) {
      const execFileError = /** @type {PromisifiedExecFileException} */ (error);
      console.info(
        // eslint-disable-line no-console
        // eslint-disable-line no-console
        `Server OpenSSL cmd failed with error code ${execFileError.code}`
      );

      serverOutput = {
        stdin: serverStdIn.join(", "),
        stdout: execFileError.stdout,
        stderr: execFileError.stderr,
      };
    }

    return /** @type {RunLogs} */ ({
      client: clientOutput,
      server: {
        ...serverOutput,
        exitCode: serverProcess.child.exitCode || 0x82 /* Killed by SIGINT */,
      },
    });
  } catch (error) {
    abortController.abort(error);
    throw error;
  } finally {
    abortController.abort(new Error("THIS SHOULD NEVER HAPPEN!!!!"));
  }
}
