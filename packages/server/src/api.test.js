import { expect, describe, test, jest } from "@jest/globals";

import api from "./api.mjs";
import request from "supertest";

function checkLength(item) {
  if (item && item.length) {
    return item.length;
  }
  return 0;
}

import { MorelloPurecapOpenSSLTestCase } from "@nqminds/openssl-vuln-poc";
import scriptPaths from "./script-paths.mjs";

function getAllGoodRequests() {
  return [
    // request(api).get("/run-script/true/true"), // TODO: not implemented
    request(api).get("/run-script/true/false"),
    // request(api).get("/run-script/false/true"), // TODO: not implemented
    request(api).get("/run-script/false/false"),
  ];
}

describe("/run-script/:purecap(true|false)/:goodCert(true|false)", () => {
  afterEach(() => {
    // restore replaced property
    jest.restoreAllMocks();
  });
  test("should respond with 200", async () => {
    const requests = await Promise.all(getAllGoodRequests());
    requests.forEach((res) => expect(res.statusCode).toEqual(200));
  });
  test("should return stdin string value", async () => {
    const requests = await Promise.all(getAllGoodRequests());
    requests.forEach((res) => {
      expect(res.body).toHaveProperty("stdin");
      expect(res.body.stdin.length).not.toEqual(0);
      expect(typeof res.body.stdin).toEqual("string");
    });
  });
  test("should return stdout And/Or stderr", async () => {
    const requests = await Promise.all(getAllGoodRequests());
    requests.forEach((res) => {
      expect([res.body.stdout, res.body.stderr]).not.toEqual([
        undefined,
        undefined,
      ]);
      expect([
        checkLength(res.body.stdout),
        checkLength(res.body.stderr),
      ]).not.toEqual([0, 0]);
    });
  });
  test("stdout should have value string", async () => {
    const requests = await Promise.all(getAllGoodRequests());
    requests.forEach((res) => {
      if (res.stdout) {
        expect(typeof res.stdout).toEqual("string");
      }
    });
  });
  test("stderr should have value string", async () => {
    const requests = await Promise.all(getAllGoodRequests());
    requests.forEach((res) => {
      if (res.stderr) {
        expect(typeof res.stdout).toEqual("string");
      }
    });
  });
  test("should respond with 500 if unexpected error occurs", async () => {
    jest.spyOn(MorelloPurecapOpenSSLTestCase, "run").mockImplementation(() => {
      throw new Error("Ucexpected error!");
    });
    const response = await request(api).get("/run-script/true/false");
    expect(response.statusCode).toEqual(500);
  });
  test("should return error message if unexpected error", async () => {
    const message = "HELP an error occured!";
    jest.spyOn(MorelloPurecapOpenSSLTestCase, "run").mockImplementation(() => {
      throw new Error(message);
    });
    const response = await request(api).get("/run-script/true/false");
    expect(response.error.text).toEqual(message);
  });
  test("should respond with 501 if incorrect config", async () => {
    jest.replaceProperty(scriptPaths, "purecap", {
      goodCert: null,
      maliciousCert: null,
    });
    const response = await request(api).get("/run-script/true/false");
    expect(response.statusCode).toEqual(501);
  });
  test("should return error message if incorrect config", async () => {
    jest.replaceProperty(scriptPaths, "purecap", {
      goodCert: null,
      maliciousCert: null,
    });
    jest.replaceProperty(scriptPaths, "hybrid", {
      goodCert: null,
      maliciousCert: null,
    });

    const response_purecap_good = await request(api).get(
      "/run-script/true/true"
    );
    expect(response_purecap_good.error.text).toEqual(
      "goodCert certificate for purecap mode is not implemented"
    );

    const response_purecap_bad = await request(api).get(
      "/run-script/true/false"
    );
    expect(response_purecap_bad.error.text).toEqual(
      "maliciousCert certificate for purecap mode is not implemented"
    );

    const response_hybrid_good = await request(api).get(
      "/run-script/false/true"
    );
    expect(response_hybrid_good.error.text).toEqual(
      "goodCert certificate for hybrid mode is not implemented"
    );

    const response_hybrid_bad = await request(api).get(
      "/run-script/false/false"
    );
    expect(response_hybrid_bad.error.text).toEqual(
      "maliciousCert certificate for hybrid mode is not implemented"
    );
  });
});
