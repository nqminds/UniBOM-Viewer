import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { runTest } from "./run-utils.mjs";
import { DEFAULT_SSH_CLI_OPTIONS, runViaSSH } from "./ssh-utils.mjs";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL(".", import.meta.url));
import path from "path";

/** @typedef {import("./ssh-utils.mjs").SSHOpts} SSHOpts */
/** @typedef {import("./run-utils.mjs").RunLogs} RunLogs */

/**
 * OpenSSL Run Test Case options
 *
 * @typedef {object} OpenSSLTestCaseRunOptions
 * Options that can be passed to {@link OpenSSLTestCase~run()}.
 * @property {number} [port] - The port to run the OpenSSL tests on.
 */

/**
 * Generic test case for testing/exploiting [OpenSSL's CVE-2022-3602][1].
 *
 * [1]: https://nvd.nist.gov/vuln/detail/CVE-2022-3602
 */
export class OpenSSLTestCase {
  /**
   * Run OpenSSL Test Case.
   *
   * @abstract
   * @param {OpenSSLTestCaseRunOptions} [_opts] - Optional options.
   * @returns {Promise<RunLogs>} Resolves when the processes are closed with the logs of the process.
   */
  async run(
    _opts = {} // eslint-disable-line no-unused-vars
  ) {
    throw new Error("Unimplemented");
  }
}

/**
 * Runs the OpenSSL test case on the local machine with the default OpenSSL
 * binary (if it's installed).
 */
export class LocalHostTestCase extends OpenSSLTestCase {
  /**
   * @inheritdoc
   */
  async run({ port } = {}) {
    // runs tests with default options on localhost
    return await runTest({
      sshOpts: null,
      port,
    });
  }

  /**
   * Makes sure that:
   *
   * 1. OpenSSL is installed via `apt`
   * 2. If running Ubuntu 22.04, make sure that OpenSSL has been patched to fix CVE-2022-3602.
   */
  async setup() {
    const cmd = promisify(execFile)("dpkg-query", [
      "--showformat",
      '"${Version}"',
      "--show",
      "openssl",
    ]);
    let dpkgQueryStdout = "";
    try {
      const { stdout } = await cmd;
      dpkgQueryStdout = stdout;
    } catch (error) {
      throw new Error(
        `Failed to run ${cmd.child.spawnargs.join(
          " "
        )}. Have you ran 'apt install openssl?`,
        { cause: error }
      );
    }

    const version = JSON.parse(dpkgQueryStdout);
    if (typeof version !== "string") {
      throw new Error(
        `Got output ${dpkgQueryStdout} from ${cmd.child.spawnargs.join(" ")} ` +
          "but expected JSON string"
      );
    }

    // subset of https://manpages.debian.org/wheezy/dpkg-dev/deb-version.5.en.html
    const [upstreamVersion, debianRevision] = version.split("-");
    // Ubuntu Jammy
    if (upstreamVersion === "3.0.2") {
      const [debianMajorRevision, debianMinorRevisionStr] =
        debianRevision.split(".");
      if (debianMajorRevision === "0ubuntu1") {
        const debianMinorRevision = parseInt(debianMinorRevisionStr);
        if (!isNaN(debianMinorRevision) && debianMinorRevision < 7) {
          // OpenSSL hasn't been patched, run `sudo apt upgrade` to update!
          throw new Error(
            `Your OpenSSL version: ${version} is vulnerable to CVE-2022-3602. ` +
              "Running 'sudo apt update && sudo apt upgrade' should update " +
              "this to at least 3.0.2-0ubuntu1.7"
          );
        }
      }
    }
  }
}

/**
 * Same as {@link LocalHostTestCase}, except with a normal
 * certificate, so should exit without any errors.
 */
export class LocalHostTestCaseSafeCert extends LocalHostTestCase {
  /**
   * @inheritdoc
   */
  async run({ port } = {}) {
    // runs tests with default options on localhost
    return await runTest({
      sshOpts: null,
      port,
      maliciousClientCA: false,
    });
  }
}

/**
 * Helper functions that apply to all Morello test cases.
 */
export class MorelloOpenSSLTestCase extends OpenSSLTestCase {
  /** @type {SSHOpts} SSH Connection Options. */
  sshOpts;

  /**
   * Constructor for openssltestcase
   *
   * @param {object} opts - Options.
   * @param {SSHOpts} opts.sshOpts - SSH connection options.
   */
  constructor({ sshOpts }) {
    super();
    this.sshOpts = sshOpts;
  }

  /**
   * Makes sure that:
   *
   * 1. The Morello server is online
   * 2. Sets up an SSH control master to greatly speed up future SSH commands
   * 3. Makes sure OpenSSL is installed
   *
   * @returns {Promise<void>} Resolves when server is setup. Rejects if there
   * is an error.
   */
  async setup() {
    const certDirectory = path.join(__dirname, "../", "certs");
    console.info(`Setting up SSH connection to ${this.sshOpts.host}`); // eslint-disable-line no-console
    // create the ~/.ssh/controlmasters dir if it doesn't already exist
    await mkdir(join(homedir(), ".ssh", "controlmasters"), {
      mode: 0o700,
      recursive: true,
    });
    await runViaSSH(["true"], this.sshOpts);

    /**
     * Installs a package via FreeBSD's `pkg`.
     *
     * @param {string} pkgBinary - The `pkg` binary to use.
     * On CheriBSD, `pkg64` is Hybrid ABI and `pkg64c` is CHERI purecap ABI.
     * @param {string} packageName - The package to install.
     * @see https://man.freebsd.org/cgi/man.cgi?pkg(7)
     */
    const pkgInstall = async (pkgBinary, packageName) => {
      await runViaSSH(
        [
          // Install Hybrid ABI version of OpenSSL 3.0.2
          "ASSUME_ALWAYS_YES=yes",
          pkgBinary,
          "update",
        ],
        this.sshOpts
      );
      await runViaSSH(
        [
          // Install Hybrid ABI version of OpenSSL 3.0.2
          "ASSUME_ALWAYS_YES=yes",
          pkgBinary,
          "install",
          packageName,
        ],
        this.sshOpts
      );
    };

    // eslint-disable-next-line no-console
    console.info(
      `Installing Morello test dependencies on ${this.sshOpts.host}`
    );
    await Promise.all([
      // Install Hybrid ABI version of OpenSSL 3.0.2
      pkgInstall("pkg64", "openssl-devel-3.0.2"),
      // Install CheriABI (purecap) version of OpenSSL 3.0.2
      pkgInstall("pkg64c", "openssl-devel-3.0.2"),
      promisify(execFile)("scp", [
        // copy over certificates
        ...DEFAULT_SSH_CLI_OPTIONS,
        "-r", // recursive!
        certDirectory,
        `scp://${this.sshOpts.username}@${this.sshOpts.host}:${this.sshOpts.port}/`,
      ]),
    ]);
  }
}

/**
 * Runs the OpenSSL test case on a Morello Hybrid system.
 *
 * The OpenSSL server should be exploited to throw an SIGABRT
 * (aka return exitcode 134).
 */
export class MorelloHybridOpenSSLTestCase extends MorelloOpenSSLTestCase {
  /**
   * @inheritdoc
   *
   */
  async run({ port } = {}) {
    return await runTest({
      sshOpts: this.sshOpts,
      serverOpensslBinary: "/usr/local64/bin/openssl",
      port,
    });
  }
}

/**
 * Same as {@link MorelloHybridOpenSSLTestCase}, except with a normal
 * certificate, so should exit without any errors.
 */
export class MorelloHybridOpenSSLTestCaseSafeCert extends MorelloHybridOpenSSLTestCase {
  /**
   * @inheritdoc
   */
  async run({ port } = {}) {
    return await runTest({
      maliciousClientCA: false,
      sshOpts: this.sshOpts,
      serverOpensslBinary: "/usr/local64/bin/openssl",
      port,
    });
  }
}

/**
 * Runs the OpenSSL test case on a Morello Purecap system.
 *
 * The OpenSSL server should throw a CHERI `SIGPROT`.
 * (aka return exitcode 162).
 */
export class MorelloPurecapOpenSSLTestCase extends MorelloOpenSSLTestCase {
  /**
   * @inheritdoc
   */
  async run({ port } = {}) {
    return await runTest({
      sshOpts: this.sshOpts,
      serverOpensslBinary: "/usr/local/bin/openssl",
      port,
    });
  }
}

/**
 * Same as {@link MorelloPurecapOpenSSLTestCase}, except with a normal
 * certificate, so should exit without any errors.
 */
export class MorelloPurecapOpenSSLTestCaseSafeCert extends MorelloPurecapOpenSSLTestCase {
  /**
   * @inheritdoc
   */
  async run({ port } = {}) {
    return await runTest({
      maliciousClientCA: false,
      sshOpts: this.sshOpts,
      serverOpensslBinary: "/usr/local/bin/openssl",
      port,
    });
  }
}
