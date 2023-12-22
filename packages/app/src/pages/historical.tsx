/* eslint-disable no-console */
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CircularProgress, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import { Paper } from "@/modules/common";
import { NqmCyberAPI } from "@nqminds/cyber-demonstrator-client";
import { useRouter } from 'next/router';
import CpeTimeline from '@/modules/cve/cpe-timeline';
import Dashboard from '@/modules/cve/dashboard';


const nqmCyberApi = new NqmCyberAPI({ BASE: `/api` });

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

export default function CpeDataPage() {
  const router = useRouter();
  const [cpeData, setCpeData] = useState<CpeData>({});
  const [loading, setLoading] = useState(false);

  const color1 = '#E0F7FA'; // Light blue
  const color2 = '#E8F5E9'; // Light green


  const getColorForWeakType = (weakType: string | undefined) => {
    switch (weakType) {
      case 'not-memory-related': return { backgroundColor: '#59cd90', color: '#fff' };
      case 'other-memory-related': return { backgroundColor: '#ea8c55', color: '#fff' };
      case 'spatial-memory-related': return { backgroundColor: '#c75146', color: '#fff' };
      case 'temporal-memory-related': return { backgroundColor: '#ad2e24', color: '#fff' };
      case 'No Info': return { backgroundColor: '#ffea00', color: '#000' };
      default: return {};
    }
  };
    useEffect(() => {
        const fetchCpeData = async () => {
            if (router.query.cpe) {
                setLoading(true);
                try {
                const cpeInput = router.query.cpe as string;
                const data = await nqmCyberApi.default.historicalCpeAnalysis({ cpe: cpeInput });
                
                if (typeof data === 'object' && !Array.isArray(data)) {
                    setCpeData(data);
                } else {
                    console.error('Unexpected data format received from API');
                }
                } catch (error) {
                console.error('Error fetching CPE data:', error);
                }
                setLoading(false);
            }
        };
    fetchCpeData();
  }, [router.query]);

  return (
    <React.Fragment>
      <Box sx={{ p: 4 }}>
        <Paper>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: "100%" }}>
              <CircularProgress />
            </Box>
          ) : (
            <Card sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ p: 2 }}>
                CPE History Visualization
              </Typography>
              {/* ADD new component here */}
              <Dashboard cpeData={cpeData} />
              <Typography variant="h6" sx={{ p: 2 }}>
                CPE History TimeLine
              </Typography>
              <CpeTimeline cpeData={cpeData} />
              <Typography variant="h2" sx={{ p: 2 }}>
                THE DATA BELLOW IS GOING TO BE REMOVED! THIS IS JUST FOR TESTING
              </Typography>
              <TableContainer>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell>CPE</TableCell>
                      <TableCell>CVE</TableCell>
                      <TableCell>CWE</TableCell>
                      <TableCell>Weakness Type</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(cpeData).map(([cpe, cveDetails], index) => (
                      cveDetails.map((detail, detailIndex) => (
                        <TableRow key={`${index}-${detailIndex}`}>
                          {detailIndex === 0 && (
                            <TableCell 
                              rowSpan={cveDetails.length} 
                              sx={{ backgroundColor: index % 2 === 0 ? color1 : color2 }}
                            >
                              {cpe}
                            </TableCell>
                          )}
                          <TableCell sx={{ backgroundColor: index % 2 === 0 ? color1 : color2 }}>{detail.cve}</TableCell>
                          <TableCell sx={{ backgroundColor: index % 2 === 0 ? color1 : color2 }}>{detail.cwe ? detail.cwe.join(', ') : 'N/A'}</TableCell>
                          <TableCell sx={{ backgroundColor: index % 2 === 0 ? color1 : color2 }}>
                            <Chip
                              label={detail.weakType || 'N/A'}
                              sx={getColorForWeakType(detail.weakType)}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </Paper>
      </Box>
    </React.Fragment>
  );  
}
