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
  const [currentCPE, setCurrentCPE] = useState("");
  const [totalCPEs, setTotalCPEs] = useState(0);
  const [loadedCPEs, setLoadedCPEs] = useState(0);
  const progressPercent = totalCPEs > 0 ? (loadedCPEs / totalCPEs * 100).toFixed(0) : 0;

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
        const messageData = JSON.parse(event.data);
        if (messageData.type === 'total') {
          setTotalCPEs(messageData.total);
        } else {
          setCpeData((prevData) => ({
            ...prevData,
            [messageData.cpe]: [...(prevData[messageData.cpe] || []), messageData.data]
          }));
          setLoadedCPEs(messageData.processed);
          setCurrentCPE(messageData.cpe);
        }
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
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" width="100%" sx={{ mt: 4, mb: 4 }}>
                  <Box position="relative" display="inline-flex" width="100%" justifyContent="center" sx={{ mb: 5 }}>
                    <CircularProgress variant="determinate" value={Number(progressPercent)} size={68} />
                    <Box
                      top={0}
                      left={0}
                      bottom={0}
                      right={0}
                      position="absolute"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Typography variant="caption" component="div" color="textPrimary">
                        {`${progressPercent}%`}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="subtitle1">
                    Loading historical information about CPE
                  </Typography>
                  <Typography variant="subtitle2">
                    {currentCPE}
                  </Typography>
                </Box>
            )}
          </Box>
          <Card sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ p: 2 }}>
              CPE History Visualization
            </Typography>
            <Dashboard cpeData={cpeData} loadedCPEs={loadedCPEs} totalCPEs={totalCPEs} />
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
