import {red, amber, orange, green} from "@mui/material/colors";
import {
  type CVE,
  CVE_with_CVSSv31,
  CVE_with_CVSSv20,
} from "@nqminds/cyber-demonstrator-client";

const critical: CVE_with_CVSSv31["baseSeverity"] = "CRITICAL";
const high: CVE_with_CVSSv31["baseSeverity"] = "HIGH";
const medium: CVE_with_CVSSv31["baseSeverity"] = "MEDIUM";
const low: CVE_with_CVSSv31["baseSeverity"] = "LOW";
const none: CVE_with_CVSSv31["baseSeverity"] = "NONE";

export type CVE_MemSafe_Severity =
  | CVE_with_CVSSv31["baseSeverity"]
  | "MITIGATED";

export const mitigated: CVE_MemSafe_Severity = "MITIGATED";

export function severityColourMap(severity: CVE_MemSafe_Severity) {
  switch (severity) {
    case critical:
      return red[800];
    case high:
      return red[400];
    case medium:
      return orange[600];
    case low:
      return amber[300];
    case mitigated:
      return green[500];
    default:
      return null;
  }
}

function v3Classification(score: CVE_with_CVSSv31["baseScore"]) {
  if (score >= 9) return critical;
  if (score >= 7) return high;
  if (score >= 4) return medium;
  if (score >= 0.1) return low;
  return none;
}

function v2Classification(score: CVE_with_CVSSv20["baseScore"]) {
  if (score >= 7) return high;
  if (score >= 4) return medium;
  return low;
}

function classifySeverityScore(
  score: CVE["baseScore"],
  version: CVE["version"],
) {
  if (version === "3.1") {
    return v3Classification(score);
  }
  return v2Classification(score);
}

/**
 * Make sure the `baseSeverity` field of a CVE exists.
 *
 * @param cve - The CVE from the vulnerability-analysis API
 * @returns A CVE object that always has a `baseSeverity` field
 */
export function categoriseCve(cve: CVE) {
  if (cve.version !== "3.1") {
    return {
      ...cve,
      baseSeverity: classifySeverityScore(cve.baseScore, cve.version),
    };
  }
  return cve;
}

/**
 * Set the `baseSeverty` to `"MITIGATED"` if the given CVE may be mitigated
 * by Morello Purecap.
 *
 * @param cveWithBaseSeverity - CVE with `baseSeverity`.
 * @returns CVE with `baseSevertiy` potentially set to `"MITIGATED"`
 */
export function categoriseMemSafeCve(
  cveWithBaseSeverity: ReturnType<typeof categoriseCve>,
) {
  const {cwes} = cveWithBaseSeverity;
  if (cwes.find(({memoryCwe}) => memoryCwe)) {
    return {...cveWithBaseSeverity, baseSeverity: mitigated};
  }
  return cveWithBaseSeverity;
}
