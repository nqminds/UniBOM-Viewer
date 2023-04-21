/* eslint-disable no-await-in-loop */
/* eslint-disable promise/prefer-await-to-then */
/* eslint-disable no-console */
/* eslint-disable max-len */
import { execFile, spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

/**
 * Polls until the given SSH server is online.
 *
 * @param {string} host - The server host to poll.
 * @param {string} port - The server port to poll.
 * @param {object} [opt] - Optional options.
 * @param {number} [opt.timeout] - Max time to poll in milliseconds before
 * throwing an error.
 * @param {AbortSignal} [opt.signal] - If set, can be used to abort this function.
 *
 * @returns {Promise<void>} Resolves when the server is online and seems to be an SSH server, else rejects.
 */
async function pollUntilSSHOnline(
  host,
  port,
  { timeout = 300000, signal } = {}
) {
  const endTime = Date.now() + timeout;

  while (Date.now() < endTime) {
    const process = promisify(execFile)(
      "curl",
      ["--http0.9", `${host}:${port}`],
      { signal }
    );
    try {
      const { stdout } = await process;
      if (stdout.startsWith("SSH")) {
        // server is online and is an SSH server
        return;
      } else {
        throw new Error(
          `Calling ${
            process.child.spawnfile + process.child.spawnargs
          } got unexpected output ${stdout}`
        );
      }
    } catch (error) {
      // See https://everything.curl.dev/usingcurl/returns
      switch (process.child.exitCode) {
        case 7:
        // Failed to connect to host, (i.e. server is offline)
        // falls through
        case 52:
        // Empty reply from server
        // happens when QEMU is starting
        // falls through
        case 56:
          // Failure in receiving network data
          // Happens when Docker is still starting
          await promisify(setTimeout)(500);
          continue;
        default:
          throw error;
      }
    }
  }

  throw new Error(
    `Timeout: Checking for SSH server at ${host}:${port} timed-out after ${
      timeout / 1000
    }s`
  );
}

/**
 * @typedef {object} DockerServerOptions Options for {@link DockerServer}.
 *
 * @property {string} name - The name to use for the Docker image.
 * @property {string} host - The IP address to expose the SSH server on.
 * By default this is `127.0.0.2`, so you can only connect to it locally.
 * @property {number} port - The port on the host to expose the SSH server on.
 */

/**
 * Runs a Morello CheriBSD server in a Docker container.
 */
export class DockerServer {
  /**
   * Path to Docker CLI executable to run.
   */
  #docker_cli = "podman";
  /**
   * The Docker image to use.
   */
  #image = "docker.io/aloisklink/cheribuild-edgesec:morello-purecap-20220511";

  /**
   * @type {DockerServerOptions} Options passed in the constructor.
   */
  #opts;

  /**
   * @type {Promise<{code: number | null, signal: string | null}> | null}
   * Promise that resolves when the process is finished.
   */
  #processClosedPromise = null;

  /**
   * Constructor that sets options for {@link DockerServer}
   *
   * @param {Partial<DockerServerOptions>} [opts] - Optional options.
   */
  constructor({
    name = "nqminds-openssl-vuln-poc-server",
    host = "127.0.0.2",
    port = 2222,
  } = {}) {
    this.#opts = { name, host, port };
  }

  /**
   * Downloads the Docker image.
   *
   * The setup() command will also automatically download this image, but
   * because downloading the images takes a long time (~10 GiB download),
   * you probably want to have a download in a separate step, as it will need
   * a bigger timeout.
   */
  async pullImage() {
    return await promisify(execFile)(this.#docker_cli, ["pull", this.#image], {
      // log download progress to default stderr
      stdio: "inherit",
    });
  }

  /**
   * Throws an Error if a container with the given name already exists.
   *
   * This should only happen if Node.JS crashed, or if we're running two server
   * instances, as otherwise we automatically close the container.
   *
   * @returns {Promise<void>} Rejects if the container already exists.
   */
  async throwIfRunning() {
    try {
      const { stdout } = await promisify(execFile)(this.#docker_cli, [
        "container",
        "inspect",
        "--format",
        "{{.State.Running}}",
        this.#opts.name,
      ]);
      if (JSON.parse(stdout) === true) {
        throw new Error(
          `The podman container ${this.#opts.name} is already running. ` +
            `You can stop the already running version using 'podman stop ${
              this.#opts.name
            }'`
        );
      } else {
        throw new Error(
          `The podman container ${
            this.#opts.name
          } already exists but is not running. ` +
            `You may want to delete it with 'podman container rm ${
              this.#opts.name
            }'`
        );
      }
    } catch (error) {
      if (error.code === 125) {
        return; // container doesn't exist, which is great!
      }
      throw error;
    }
  }

  /**
   * Starts the Docker image.
   *
   * @param {object} [opts] - Optional options.
   * @param {boolean} [opts.quiet] - If `false`, print the massive amount of
   * logs to Node.JS's stderr (helpful for debugging).
   * @param {string} [opts.sshPublicKeyPath] - The path to the SSH public
   * key to use for the Docker server. The associated private key should be
   * usable without any user input (i.e. no password/pressing a FIDO2 key),
   * so that we can automatically use it to SSH into the Docker server.
   * Defaults to `~/.ssh/id_ed25519.pub`.
   * @param {AbortSignal} [opts.signal] - If set, an abort signal that can
   * be used to cancel the process.
   * @returns {Promise<void>} Resolves when the Docker image is ready to be
   * SSH-ed into.
   */
  async setup({
    quiet = true,
    sshPublicKeyPath = join(homedir(), ".ssh", "id_ed25519.pub"),
    signal,
  } = {}) {
    const sshPublicKey = await readFile(sshPublicKeyPath, {
      encoding: "utf8",
    });

    // thow an error if the container is already running
    // (should only happen if two versions of the server are running at once)
    await this.throwIfRunning();

    this.process = spawn(
      this.#docker_cli,
      [
        "run",
        // "-it",
        "--rm",
        "--publish",
        `${this.#opts.host}:${this.#opts.port}:2222/tcp`,
        "--name",
        this.#opts.name,
        "--user",
        "root",
        "--init",
        // about a 10 GiB download, 30 GiB uncompressed
        this.#image,
        "bash",
        "-c",
        String.raw`
        #!/usr/bin/env bash

        set +e # exit on error

        if [ -z "$1" ]; then
          >&2 echo "No SSH public key supplied!"
          exit 1
        fi

        su --command 'mkdir /home/ubuntu/.ssh && printf "%s" "$1" > /home/ubuntu/.ssh/cheribsd-ssh-key.pub' -- ubuntu "n/a" "$1"

        # pipes everything on port 2222 to 'localhost:2223'
        # This is so that we can access the SSH server from outside the docker container
        apt-get update && apt-get install socat --yes
        su --command 'socat tcp-listen:2222,reuseaddr,fork tcp:localhost:2223' -- ubuntu &

        su --command 'cd /home/ubuntu/cheribuild && ./cheribuild.py --run/ephemeral --run/ssh-forwarding-port 2223 disk-image-morello-purecap run-morello-purecap --skip-update' -- ubuntu

        wait
      `,
        "", // this arg is passed as the arg0 and is unused
        sshPublicKey,
      ],
      {
        stdio: quiet ? undefined : "inherit",
        signal,
      }
    );

    this.#processClosedPromise = new Promise((resolve, reject) => {
      let resolved = false;

      this.process.on("exit", (code, sig) => {
        if (!resolved) {
          resolved = true;
          resolve({ code, sig });
        }
      });
      this.process.on("error", (error) => {
        resolved = true;
        reject(error);
      });
    });

    // check for any errors start process
    await new Promise((resolve, reject) => {
      this.process.on("error", reject);
      this.process.on("spawn", () => {
        this.process.off("error", reject);
        resolve();
      });
    });

    console.log("Polling until SSH server is online");

    /**
     * Used to automatically stop {@link pollUntilSSHOnline} early if our
     * Docker server fails for any reason.
     */
    const abortController = new AbortController();

    // eslint-disable-next-line promise/catch-or-return
    this.#processClosedPromise.then(({ code, sig }) => {
      abortController.abort(
        new Error(
          `Running ${this.#image} exited with code ${code} and signal ${sig}`
        )
      );
    });

    await pollUntilSSHOnline(this.#opts.host, this.#opts.port, {
      signal: abortController.signal,
    });
  }

  /**
   * Stops the Docker image.
   *
   * Please always call, otherwise you'll have to run `podman stop <cointainer_id>` manually.
   */
  async stop() {
    if (this.process) {
      this.process.kill("SIGTERM");

      const timeout = setTimeout(() => {
        // eslint-disable-next-line no-unused-expressions
        this.process.kill("SIGKILL"), 30_000;
      });
      await this.#processClosedPromise;
      clearTimeout(timeout);
    }
  }
}
