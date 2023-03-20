# OpenSSL Vulnerability PoC

Node.JS functions for testing a Denial-of-Service (DoS) attack on OpenSSL
exploiting [CVE-2022-3602](https://nvd.nist.gov/vuln/detail/CVE-2022-3602).

These functions are adapted from the
[malicious client scenario in DataDog/security-labs-pocs@d25e1ac][1]

[1]: https://github.com/DataDog/security-labs-pocs/tree/d25e1ac3a240489cda949114c732793685a1fae6/proof-of-concept-exploits/openssl-punycode-vulnerability/malicious_client

## Usage

These are currently only mocked functions, so the API may change in the future.

```javascript
import { MorelloPurecapOpenSSLTestCase } from "@nqminds/openssl-vuln-poc";

const res = await MorelloPurecapOpenSSLTestCase.run();
console.log(`Server output error logs were: ${res.server.stderr}`);
```

## Bash scripts to implement in JavaScript

### Server

```bash
openssl s_server -accept 3000 -CAfile certs/cacert.pem -cert certs/server.cert.pem -key certs/server.key.pem  -state -verify 1
```

### Client

```bash
openssl s_client -connect 127.0.0.1:3000 -key certs/client.key.pem  -cert certs/client.cert.pem -CAfile certs/malicious-client-cacert.pem -state
```
