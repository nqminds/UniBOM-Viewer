import { expect } from "@jest/globals";

/**
 * Asserts that the given object is a valid {@link RunLogs} object.
 *
 * @param {import("./index.mjs").RunLogs} runLogsObj - The object to check.
 * @returns {Promise<void>} Resolves if the object is valid, rejects otherwise.
 */
export function expectValidRunLogs(runLogsObj) {
  return expect(runLogsObj).toEqual(
    expect.objectContaining({
      client: expect.objectContaining({
        stdout: expect.any(String),
        stderr: expect.any(String),
      }),
      server: expect.objectContaining({
        stdout: expect.any(String),
        stderr: expect.any(String),
        exitCode: expect.any(Number),
      }),
    })
  );
}
