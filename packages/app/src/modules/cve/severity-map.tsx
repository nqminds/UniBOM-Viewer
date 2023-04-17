import {red, amber, orange} from "@mui/material/colors";

const critical:cve["baseSeverity"] = "CRITICAL";
const high:cve["baseSeverity"] = "HIGH";
const medium:cve["baseSeverity"] = "MEDIUM";
const low:cve["baseSeverity"] = "LOW";
const none:cve["baseSeverity"] = "NONE";

export function severityColourMap(severity:cve["baseSeverity"]) {
  switch (severity) {
    case critical:
      return red[800];
    case high:
      return red[400];
    case medium:
      return orange[600];
    case low:
      return amber[300];
    default:
      return null;
  }
}

function v3Classification(score:cve["baseScore"]) {
  if (score >= 9) return critical;
  if (score >= 7) return high;
  if (score >= 4) return medium;
  if (score >= 0.1) return low;
  return none;
}

function v2Classification(score:cve["baseScore"]) {
  if (score >= 7) return high;
  if (score >= 4) return medium;
  return low;
}

export function classifySeverityScore(score:number, version:string) {
  if (version.includes("3")) {
    return v3Classification(score);
  }
  return v2Classification(score);
}


