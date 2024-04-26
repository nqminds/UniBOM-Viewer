/* eslint-disable consistent-return */
/* eslint-disable no-console */
import React, { useState, useEffect, useRef } from 'react';
import { Box, Card, CircularProgress, Typography, Button } from '@mui/material';
import { Paper } from '@/modules/common';
import { useRouter } from 'next/router';
import CpeTimeline from '@/modules/cve/cpe-timeline';
import Dashboard from '@/modules/cve/dashboard';

// Interfaces for expected data structure
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
// TODO: FIX THE DISPLAY CIRCULAR BAR ISSUE 
export default function CpeDataPage() {
  const router = useRouter();
  const [cpeData, setCpeData] = useState<CpeData>({});
  const [initialLoad, setInitialLoad] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const cpeInput = router.query.cpe as string;
    const savedCpeData = localStorage.getItem('cpeData');
    const storedCpeKey = localStorage.getItem('cpeKey');

    // Reset if the CPE input is different
    if (cpeInput !== storedCpeKey) {
      localStorage.removeItem('cpeData'); // Clear previous data
      setCpeData({});
    } else if (savedCpeData) {
      // Load from localStorage only if the CPE input is the same
      setCpeData(JSON.parse(savedCpeData));
      setInitialLoad(false);
    }

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
        setCpeData((prevData) => {
          const updatedData = {
            ...prevData,
            [newEntry.cpe]: [...(prevData[newEntry.cpe] || []), newEntry.data],
          };

          // Save updated data to localStorage
          localStorage.setItem('cpeData', JSON.stringify(updatedData));
          localStorage.setItem('cpeKey', cpeInput);

          return updatedData;
        });
        setInitialLoad(false); 
      };

      eventSource.onerror = (error) => {
        console.error('EventSource failed:', error);
        eventSource.close();
      };

      return () => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
      };
    }
  }, [router.query]); // Re-run effect when router query changes

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
          <Button color="error" onClick={cancelRequest} sx={{ mt: 2 }}>
            Cancel Request
          </Button>
          <Card sx={{ mt: 4, position: 'relative' }}>
            {/* Overlay with CircularProgress to indicate loading */}
            {initialLoad && (
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                display="flex"
                justifyContent="center"
                alignItems="center"
                bgcolor="rgba(255, 255, 255, 0.75)" // Semi-transparent overlay
                zIndex={1} // Ensures it's above the card content
              >
                <CircularProgress />
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Loading historical information about CPE {router.query.cpe}
                </Typography>
              </Box>
            )}

            {/* Main content always displayed */}
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