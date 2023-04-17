import {
  MorelloPurecapOpenSSLTestCase,
  MorelloHybridOpenSSLTestCase,
} from "@nqminds/openssl-vuln-poc";

export default {
  purecap: {
    goodCert: null,
    maliciousCert: MorelloPurecapOpenSSLTestCase,
  },
  hybrid: {
    goodCert: null,
    maliciousCert: MorelloHybridOpenSSLTestCase,
  },
};
