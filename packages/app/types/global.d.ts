declare interface sbomComponent {
  name: string;
  version: string;
  licenses: string;
  cves: cve[];
  cpe: string;
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

// Dash board components

interface CVEData {
  cve?: string;
  cwe?: string[];
  weakType?: string;
  baseScore?: number;
  baseSeverity?: string;
}

interface CpeData {
  [cpe: string]: CVEData[];
}

interface MemoryTypes {
  [key: string]: number;
}

interface Severities {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  CRITICAL: number;
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface DashboardProps {
  cpeData: CpeData;
  loadedCPEs: number;
  totalCPEs: number;
}


interface AverageScoreData {
    index: number;
    averageScore: number;
  }

// cpe timeline components

interface TimelineItemProps {
  title: string;
  details: any[];
  index: number;
}

// popup components

interface Severity {
  value: string;  // 'CRITICAL', 'HIGH', 'MEDIUM', or 'LOW'
  count: number;
}

interface SeverityCounts {
  [key: string]: number;
}

interface SeverityDistributionPopupProps {
  open: boolean;
  onClose: () => void;
  severities: Severity[];
}

interface CveTableProps {
  open: boolean;
  cves: cve[];
  extraContent?: React.ReactNode;
}