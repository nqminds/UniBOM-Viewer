declare interface sbomComponent {
  name: string;
  version: string;
  licenses: string;
  cves: cve[];
}

declare interface cve {
  id: string | undefined;
  name: string;
  description: string;
  licences: string;
  cwes: cwe[];
  baseScore: number;
  baseSeverity:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL"
    | "NONE"
    | "MITIGATED"
    | undefined;
  version: string;
  vectorString: string;
}

declare interface cwe {
  name: string;
  memoryCwe: boolean;
}
