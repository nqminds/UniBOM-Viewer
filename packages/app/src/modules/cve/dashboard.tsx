/* eslint-disable no-console */
import React from "react";
import {Paper, Typography, Grid, Box} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import semver from 'semver';

const getVersion = (cpe: string): string => {
  // Regular expression to extract version from CPE
  const regex = /:\b\d+(?:\.\d+){0,2}(?:[-+][\w.]+)?\b/g; // Updated to match a broader range of versions
  try {
    const matches = regex.exec(cpe);
    if (matches && matches[0]) {
      const version = matches[0].substring(1); // Remove leading colon
      const validVersion = semver.valid(semver.coerce(version));
      return validVersion || "0.0.0";
    }
  } catch (error) {
    console.error('Error extracting version:', error);
  }
  return "0.0.0";
}

const getColorForWeakType = (weakType: string | undefined) => {
  switch (weakType) {
    case "not-memory-related":
      return {backgroundColor: "#f7b267", color: "#fff"};
    case "other-memory-related":
      return {backgroundColor: "#f79d65", color: "#fff"};
    case "spatial-memory-related":
      return {backgroundColor: "#f4845f", color: "#fff"};
    case "temporal-memory-related":
      return {backgroundColor: "#f27059", color: "#fff"};
    case "No Info":
      return {backgroundColor: "#ffea00", color: "#000"};
    default:
      return {};
  }
};

// Helper function to aggregate data for pie chart (Memory Types)
const aggregateMemoryTypes = (cpeData: CpeData): ChartData[] => {
  const memoryTypes: MemoryTypes = {};

  Object.values(cpeData)
    .flat()
    .forEach((cveData) => {
      const type = cveData.weakType || "Unknown";
      memoryTypes[type] = (memoryTypes[type] || 0) + 1;
    });

  return Object.entries(memoryTypes).map(([name, value]) => ({
    name,
    value,
    color: getColorForWeakType(name).backgroundColor, // Use the color mapping function
  }));
};

const barColors: {[key: string]: string} = {
  LOW: "green",
  MEDIUM: "yellow",
  HIGH: "orange",
  CRITICAL: "red",
};

// Helper function to aggregate data for bar chart (Base Severities)
const aggregateBaseSeverities = (cpeData: CpeData): ChartData[] => {
  const severitiesCount: {[key: string]: Set<string>} = {
    LOW: new Set<string>(),
    MEDIUM: new Set<string>(),
    HIGH: new Set<string>(),
    CRITICAL: new Set<string>(),
  };

  Object.values(cpeData).forEach((cveList: CVEData[]) => {
    cveList.forEach((cveData: CVEData) => {
      const {cve, baseSeverity} = cveData;
      if (cve && baseSeverity && severitiesCount[baseSeverity]) {
        severitiesCount[baseSeverity].add(cve);
      }
    });
  });

  return Object.entries(severitiesCount).map(
    ([name, cveSet]): ChartData => ({
      name,
      value: cveSet.size,
    }),
  );
};

const calculateAverageScoresPerCpe = (cpeData: CpeData): AverageScoreData[] => {
  let index = 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return Object.entries(cpeData).map(([cpe, cveList]) => {
    const totalScore = cveList.reduce((acc, cveData) => {
      return acc + (cveData.baseScore || 0);
    }, 0);
    const averageScore = cveList.length > 0 ? parseFloat((totalScore / cveList.length).toFixed(2)) : 0;
    return {
      index: ++index,
      averageScore,
    };
  });
};

type SeverityKey = keyof SeverityCounts | undefined;

const prepareTimeSeriesData = (cpeData: CpeData): TimeSeriesData[] => {
  const timeSeriesData: TimeSeriesData[] = [];

  Object.entries(cpeData).forEach(([cpe, cveList]) => {
      const severityCounts: SeverityCounts = { total: 0, HIGH: 0, MEDIUM: 0, LOW: 0, CRITICAL: 0 };
      const version = getVersion(cpe);

      cveList.forEach((cve) => {
          const severity: SeverityKey = cve.baseSeverity;
          if (severity && severity in severityCounts) {
              severityCounts[severity] = (severityCounts[severity] || 0) + 1;
              severityCounts.total++;
          }
      });
      timeSeriesData.push({
          version: version,
          ...severityCounts
      });
  });

  return timeSeriesData;
};

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="version" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="total" stroke="#8884d8" />
      <Line type="monotone" dataKey="CRITICAL" stroke="#dc143c" />
      <Line type="monotone" dataKey="HIGH" stroke="#ff8c00" />
      <Line type="monotone" dataKey="MEDIUM" stroke="#ffd700" />
      <Line type="monotone" dataKey="LOW" stroke="#90ee90" />
    </LineChart>
  </ResponsiveContainer>
);

const Dashboard: React.FC<DashboardProps> = ({
  cpeData,
  loadedCPEs,
  totalCPEs,
}) => {
  const pieData = aggregateMemoryTypes(cpeData);
  const barData = aggregateBaseSeverities(cpeData);
  const lineData = calculateAverageScoresPerCpe(cpeData);
  const timeSeriesData = prepareTimeSeriesData(cpeData);

  return (
    <Paper elevation={3} sx={{p: 2, mb: 4}}>
      <Grid container spacing={2}>
        {/* CPE Count */}
        <Grid item xs={12} sm={4}>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <Typography variant="h4" component="div" sx={{fontWeight: "bold"}}>
              {loadedCPEs}/{totalCPEs} CPEs
            </Typography>
          </Box>
        </Grid>

        {/* Bar Chart */}
        <Grid item xs={12} sm={8}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="value"
                name="Total Distribution of CVE Severity"
                fill="#8884d8"
              >
                {barData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={barColors[entry.name.toUpperCase()]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Grid>

        {/* Pie Chart */}
        <Grid item xs={12} sm={4}>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={120}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || "#8884d8"} /> // Fallback color if none provided
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Grid>
        {/* Line Chart */}
        <Grid item xs={12} sm={8}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={lineData}
              margin={{top: 5, right: 30, left: 20, bottom: 5}}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cpe" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="averageScore"
                stroke="#8884d8"
                activeDot={{r: 8}}
              />
            </LineChart>
          </ResponsiveContainer>
        </Grid>
        {/* Time Series Chart */}
        <Grid item xs={12}>
          <TimeSeriesChart data={timeSeriesData} />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default Dashboard;
