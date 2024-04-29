/* eslint-disable consistent-return */
/* eslint-disable no-console */
import React, { useState, useEffect, useRef } from 'react';
import { Box, Card, CircularProgress, Typography, Button } from '@mui/material';
import { Paper } from '@/modules/common';
import { useRouter } from 'next/router';
import CpeTimeline from '@/modules/cve/cpe-timeline';
import Dashboard from '@/modules/cve/dashboard';

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
  const [initialLoad, setInitialLoad] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const cpeInput = router.query.cpe as string;

    if (cpeInput) {
      const apiKey = sessionStorage.getItem('nistApiKey');
      const openaiApiKey = sessionStorage.getItem('openaiApiKey');
      if (!apiKey) {
        console.error('API Key is not available');
        setInitialLoad(false);
        return;
      }

      const eventSource = new EventSource(
        `/api/historical-cpe-analysis/${cpeInput}?nistApiKey=${apiKey}&openaiApiKey=${openaiApiKey}`
      );

      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        const newEntry = JSON.parse(event.data);
        setCpeData((prevData) => ({
          ...prevData,
          [newEntry.cpe]: [...(prevData[newEntry.cpe] || []), newEntry.data]
        }));
      };

      eventSource.onerror = (error) => {
        console.error('EventSource failed:', error);
        setInitialLoad(false);
        eventSource.close();
      };

      eventSource.onopen = () => {
        console.log('Connection to server opened.');
      };

      eventSource.addEventListener('done', () => {
        setInitialLoad(false);
        eventSource.close();
      });

      return () => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
      };
    }
  }, [router.query]);

  const cancelRequest = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      setInitialLoad(false);
      console.log('Streaming has been canceled by the user.');
    }
  };

  return (
    <React.Fragment>
      <Box sx={{ p: 4 }}>
        <Paper>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mt: 2 }}
          >
            <Button color="error" onClick={cancelRequest}>
              Cancel Request
            </Button>
            {initialLoad && (
              <Box
                display="flex"
                alignItems="center"
              >
                <CircularProgress size={24} /> 
                <Typography variant="subtitle1" alignItems="center" sx={{ ml: 2 }}>
                  Loading historical information about CPE {router.query.cpe}
                </Typography>
              </Box>
            )}
          </Box>
          <Card sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ p: 2 }}>
              CPE History Visualization
            </Typography>
            <Dashboard cpeData={cpeData} />
            <Typography variant="h6" sx={{ p: 2 }}>
              CPE History Timeline
            </Typography>
            <CpeTimeline cpeData={cpeData} />
          </Card>
        </Paper>
      </Box>
    </React.Fragment>
  );
}
