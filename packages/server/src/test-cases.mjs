import {
  LocalHostTestCase,
  // MorelloPurecapOpenSSLTestCase, // MOCKED SINCE BROKEN
  MorelloHybridOpenSSLTestCase,
} from "@nqminds/openssl-vuln-poc";

import { MorelloPurecapOpenSSLTestCase } from "@nqminds/openssl-vuln-poc/src/__mocks__/index.mjs";

/**
 * Mocked up Good certificate test case.
 *
 * We expect that the current server is Ubuntu 22.04, and that openssl has been
 * installed with `apt install openssl`.
 */
const MockedUpGoodCertTestCase = LocalHostTestCase;

export default {
  purecap: {
    goodCert: MockedUpGoodCertTestCase,
    maliciousCert: MorelloPurecapOpenSSLTestCase,
  },
  hybrid: {
    goodCert: MockedUpGoodCertTestCase,
    maliciousCert: MorelloHybridOpenSSLTestCase,
  },
};
