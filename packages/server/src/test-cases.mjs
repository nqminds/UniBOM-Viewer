import {
  // MorelloPurecapOpenSSLTestCase, // MOCKED SINCE BROKEN (see https://github.com/nqminds/cyber/issues/23)
  // MorelloPurecapOpenSSLTestCaseSafeCert, // MOCKED SINCE BROKEN (see https://github.com/nqminds/cyber/issues/23)
  MorelloHybridOpenSSLTestCase,
  MorelloHybridOpenSSLTestCaseSafeCert,
} from "@nqminds/openssl-vuln-poc";

import {
  MorelloPurecapOpenSSLTestCase,
  MorelloPurecapOpenSSLTestCaseSafeCert,
} from "@nqminds/openssl-vuln-poc/src/__mocks__/index.mjs";

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
