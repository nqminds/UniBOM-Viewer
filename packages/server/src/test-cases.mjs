import {
  // MorelloPurecapOpenSSLTestCase, // MOCKED SINCE BROKEN
  MorelloPurecapOpenSSLTestCaseSafeCert,
  MorelloHybridOpenSSLTestCase,
  MorelloHybridOpenSSLTestCaseSafeCert,
} from "@nqminds/openssl-vuln-poc";

import { MorelloPurecapOpenSSLTestCase } from "@nqminds/openssl-vuln-poc/src/__mocks__/index.mjs";

export default {
  purecap: {
    goodCert: MorelloPurecapOpenSSLTestCaseSafeCert,
    maliciousCert: MorelloPurecapOpenSSLTestCase,
  },
  hybrid: {
    goodCert: MorelloHybridOpenSSLTestCaseSafeCert,
    maliciousCert: MorelloHybridOpenSSLTestCase,
  },
};
