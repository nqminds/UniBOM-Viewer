import {
  LocalHostTestCase,
  MorelloPurecapOpenSSLTestCase,
  MorelloHybridOpenSSLTestCase,
} from "@nqminds/openssl-vuln-poc";

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
