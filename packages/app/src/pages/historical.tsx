/* eslint-disable consistent-return */
/* eslint-disable no-console */
import React, { useState, useEffect, useRef } from 'react';
import { Box, Card, CircularProgress, Typography, Button } from '@mui/material';
import { Paper } from "@/modules/common";
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
    const cpeInput = router.query.cpe;
    if (cpeInput) {
      const apiKey = sessionStorage.getItem('nistApiKey');
      if (!apiKey) {
        console.error('API Key is not available');
        return;
      }
      const eventSource = new EventSource(`/api/historical-cpe-analysis/${cpeInput}?nistApiKey=${apiKey}`)
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        const newEntry = JSON.parse(event.data);
        setCpeData(prevData => ({
          ...prevData,
          [newEntry.cpe]: [...(prevData[newEntry.cpe] || []), newEntry.data]
        }));
        setInitialLoad(false);
      };

      eventSource.onerror = (error) => {
        console.error('EventSource failed:', error);
        eventSource.close();
      };

      return () => {
        eventSource.close();
      };
    }
  }, [router.query]);

  const cancelRequest = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      setInitialLoad(false);
      console.log("Streaming has been canceled by the user.");
    }
  };

return (
  <React.Fragment>
    <Box sx={{ p: 4 }}>
      <Paper>
      <Button color="error" onClick={cancelRequest} sx={{ mt: 2 }}>
              Cancel Request
      </Button>
        {initialLoad ? (
          <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" sx={{ height: "100%" }}>
            <CircularProgress />
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Please wait while loading historical information about CPE {router.query.cpe}
            </Typography>
          </Box>
        ) : (
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
        )}
      </Paper>
    </Box>
  </React.Fragment>
);
}