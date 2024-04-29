import React from 'react';
import { Paper, Typography, Grid, Box } from '@mui/material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const getColorForWeakType = (weakType: string | undefined) => {
    switch (weakType) {
      case 'not-memory-related': return { backgroundColor: '#f7b267', color: '#fff' };
      case 'other-memory-related': return { backgroundColor: '#f79d65', color: '#fff' };
      case 'spatial-memory-related': return { backgroundColor: '#f4845f', color: '#fff' };
      case 'temporal-memory-related': return { backgroundColor: '#f27059', color: '#fff' };
      case 'No Info': return { backgroundColor: '#ffea00', color: '#000' };
      default: return {};
    }
  };

// Helper function to aggregate data for pie chart (Memory Types)
const aggregateMemoryTypes = (cpeData: CpeData): ChartData[] => {
    const memoryTypes: MemoryTypes = {};
  
    Object.values(cpeData).flat().forEach((cveData) => {
      const type = cveData.weakType || 'Unknown';
      memoryTypes[type] = (memoryTypes[type] || 0) + 1;
    });
  
    return Object.entries(memoryTypes).map(([name, value]) => ({
      name,
      value,
      color: getColorForWeakType(name).backgroundColor // Use the color mapping function
    }));
  };
  

const barColors: { [key: string]: string } = {
    LOW: 'green',
    MEDIUM: 'yellow',
    HIGH: 'orange',
    CRITICAL: 'red'
  };

// Helper function to aggregate data for bar chart (Base Severities)
const aggregateBaseSeverities = (cpeData: CpeData): ChartData[] => {
    const severities: Severities = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  
    Object.values(cpeData).flat().forEach((cveData) => {
      const severityKey = cveData.baseSeverity as keyof Severities;
      if (severityKey && severities[severityKey] !== undefined) {
        severities[severityKey]++;
      }
    });
  
    return Object.entries(severities).map(([name, value]) => ({ name, value }));
  };
  
const calculateAverageScoresPerCpe = (cpeData: CpeData): AverageScoreData[] => {
    let index = 0;
    return Object.entries(cpeData).map(([cpe, cveList]) => {
      const totalScore = cveList.reduce((acc, cveData) => {
        return acc + (cveData.baseScore || 0);
      }, 0);
      const averageScore = cveList.length > 0 ? totalScore / cveList.length : 0;
      return {
        index: ++index,
        averageScore,
      };
    })
  };

const Dashboard: React.FC<DashboardProps> = ({ cpeData, loadedCPEs, totalCPEs }) => {
  const pieData = aggregateMemoryTypes(cpeData);
  const barData = aggregateBaseSeverities(cpeData);
  const lineData = calculateAverageScoresPerCpe(cpeData);

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
      <Grid container spacing={2}>

        {/* CPE Count */}
        <Grid item xs={12} sm={4}>
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              Loading {loadedCPEs}/{totalCPEs} CPEs
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
             <Bar dataKey="value" name="Overall base scores">
                 {
                 barData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={barColors[entry.name.toUpperCase()]} />
                 ))
                 }
             </Bar>
             </BarChart>
         </ResponsiveContainer>
        </Grid>

         {/* Pie Chart */}
         <Grid item xs={12} sm={4}>
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={120}>
                    {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} /> // Fallback color if none provided
                    ))}
                </Pie>
                <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </Grid>
        {/* Line Chart */}
        <Grid item xs={12} sm={8}>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cpe" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="averageScore" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default Dashboard;
