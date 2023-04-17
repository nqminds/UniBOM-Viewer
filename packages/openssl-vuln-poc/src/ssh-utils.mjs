import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";

/**
 * @typedef {object} SSHOpts SSH options.
 * @property {string} username - The username to use.
 * @property {string} host - The host of the SSH server.
 * @property {string} port - The port the SSH server is listening on.
 */

const DOCKER_HOST = "127.0.0.2";

/**
 * Default options to pass to the `ssh` command.
 *
 * @see https://manpages.ubuntu.com/manpages/jammy/man1/ssh.1.html
 */
export const DEFAULT_SSH_CLI_OPTIONS = [
  "-o",
  "ControlMaster=yes",
  "-o",
  "ControlPath=%d/.ssh/controlmasters/%r@%h:%p",
  "-o",
  "ControlMaster=auto",
  "-o",
  "ControlPersist=60m", // keep control socket open for 60m for faster SSH
  "-o",
  "StrictHostKeyChecking=no", // allow SSH even if the certificate has changed
  "-o",
  "BatchMode=yes", // we're running in a script, so don't ask the user for anything
  "-o",
  "RequestTTY=force",
  // even though we're running in a script, use a TTY.
  // This is needed so that we can send SIGINT (CTRL+C) through SSH.
];

/**
 * Escape a string so that it can be used for a POSIX shell.
 *
 * @param {string} unsafeString - The string to escape.
 * @returns {string} stdout
 */
function escapeStringForPosixShell(unsafeString) {
  // TODO: this is super inefficient and slow, can we use a JS native method?
  // TODO: make this async
  const stdout = execFileSync("printf", ["%q", unsafeString], {
    encoding: "utf8",
  });
  return stdout;
}

/**
 * Runs the given command through SSH.
 *
 * @param {string[]} command - The command to run on the remote host.
 * @param {SSHOpts} opts - The SSH connection options.
 * @param {import("node:child_process").ExecFileOptionsWithStringEncoding} [childProcessOpts] -
 * Options to pass to execFile().
 * @returns {import("node:child_process").PromiseWithChild<{stdout: string, stderr: string}>}
 * The SSH process.
 */
export function runViaSSH(command, { username, host, port }, childProcessOpts) {
  const sshCliOptions = [...DEFAULT_SSH_CLI_OPTIONS];

  if (host === DOCKER_HOST) {
    sshCliOptions.push(
      // don't store the SSH server public key for Docker servers since it always changes
      "-o",
      "UserKnownHostsFile=/dev/null"
    );
  }

  // We can't run the command directly, because we need a shell to convert
  // CHERI/abort signals to an exitcode, so that it can be sent through SSH.

  // TODO: we should probably somehow improve this code,
  // since currently it will break if we have any spaces in our variables
  const testScript = `${command.join(" ")}; exit $?`;
  // we need to escape the test script, because it's decoded by `ssh` before sending
  const escapedTestScript = escapeStringForPosixShell(testScript);

  return promisify(execFile)(
    "ssh",
    [
      ...sshCliOptions,
      `ssh://${username}@${host}:${port}`,
      "sh",
      "-c",
      escapedTestScript,
    ],
    childProcessOpts
  );
}
