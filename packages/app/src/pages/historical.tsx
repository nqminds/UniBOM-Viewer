/* eslint-disable no-console */
import React, { useState } from 'react';
import {
  Box, Button, Card, CircularProgress, Grid, TextField, Typography
} from '@mui/material';
import {Paper} from "@/modules/common";

import {NqmCyberAPI} from "@nqminds/cyber-demonstrator-client";
const nqmCyberApi = new NqmCyberAPI({BASE: `/api`});

interface CpeData {
  cpe?: string;
  cve?: string;
  cwe?: string[];
  weakType?: string;
}

export default function CpeDataPage() {
  const [cpeInput, setCpeInput] = useState('');
  const [cpeData, setCpeData] = useState<CpeData[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCpeInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCpeInput(event.target.value);
  };
  // mock data for testing
  const mockCpeData = [
    { cpe: 'mock-cpe-1', cve: 'mock-cve-1', cwe: ['CWE-123'], weakType: 'mock-type-1' },
    { cpe: 'mock-cpe-2', cve: 'mock-cve-2', cwe: ['CWE-456'], weakType: 'mock-type-2' },
    { cpe: 'mock-cpe-3', cve: 'mock-cve-3', cwe: ['CWE-789'], weakType: 'mock-type-3' },
  ];

  // TODO fetch data
  const fetchCpeData = async () => {
    setLoading(true);
    try {
      const data = await nqmCyberApi.default.historicalCpeAnalysis({
        cpe: cpeInput,
        historyFlag: 'hist' // or 'all'
      });
      if (Array.isArray(data)) {
        setCpeData(data);
      } else {
        console.log('NO DATA');
        setCpeData(mockCpeData);
      }
      
    } catch (error) {
      console.error('Error fetching CPE data:', error);
    }
    setLoading(false);
  };
  
  console.log("CPE Data:", cpeData);

  // Example data formatting for a graph
  let graphData;
  if (Array.isArray(cpeData)) {
    graphData = {
        labels: cpeData.map(data => data.cve),
        datasets: [{
        label: 'CWE Types',
        data: cpeData.map(data => {
            if (data.cwe && data.cwe.length > 0) {
            return parseInt(data.cwe[0].replace('CWE-', ''));
            } else {
            return 0;
            }
        }),
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        }]
    };
  } else {

    // Using mock data for testing
        console.log('CpeData is not an array, using mock data');
        
        graphData = {
            labels: ['Mock CVE-1', 'Mock CVE-2', 'Mock CVE-3'],
            datasets: [{
            label: 'CWE Types',
            data: [10, 20, 30], // Mock CWE data
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            }] 
        };
  }

  if (Array.isArray(cpeData) && cpeData.length > 0) {
    graphData = {
        labels: cpeData.map(data => data.cve),
        datasets: [{
            label: 'CWE Types',
            data: cpeData.map(data => {
                if (data.cwe && data.cwe.length > 0) {
                    return parseInt(data.cwe[0].replace('CWE-', ''));
                } else {
                    return 0;
                }
            }),
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
        }]
    };
}


return (
    <Box sx={{ p: 4 }}>
      <Paper>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Enter CPE"
              value={cpeInput}
              onChange={handleCpeInputChange}
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" onClick={fetchCpeData} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Fetch Data'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {Array.isArray(cpeData) && cpeData.length > 0 && (
        <Card sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ p: 2 }}>
            CPE Data Visualization
          </Typography>
          <Box sx={{ p: 2 }}>
            {cpeData.map((data, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="subtitle1">{data.cpe}</Typography>
                <ul>
                  <li>{`CVE: ${data.cve} - CWE: ${data.cwe ? data.cwe.join(', ') : 'N/A'} - Weak Type: ${data.weakType || 'N/A'}`}</li>
                </ul>
              </Box>
            ))}
          </Box>
        </Card>
      )}

    </Box>
  );
}