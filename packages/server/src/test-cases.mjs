import {
  MorelloPurecapOpenSSLTestCase,
  MorelloPurecapOpenSSLTestCaseSafeCert,
  MorelloHybridOpenSSLTestCase,
  MorelloHybridOpenSSLTestCaseSafeCert,
} from "@nqminds/openssl-vuln-poc";

/* If you want to mock any of these test cases to use known good outputs, you
 * can import them from here.
 */

// import {
//   MorelloPurecapOpenSSLTestCase,
//   MorelloPurecapOpenSSLTestCaseSafeCert,
// } from "@nqminds/openssl-vuln-poc/src/__mocks__/index.mjs";

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
