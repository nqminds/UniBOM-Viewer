/* eslint-disable no-console */
import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import { Box, Paper, Tooltip, Typography } from '@mui/material';
import LensRoundedIcon from '@mui/icons-material/LensRounded';
const SeverityDistributionPopup = dynamic(
    () => import('./pop-up'),
    { ssr: false }
  );

const TimelineItem: React.FC<TimelineItemProps> = ({ title, details, index }) => {
    const isRightSide = index % 2 !== 0;
    const [isPopupOpen, setIsPopupOpen] = useState(false);
        // Calculate the average baseScore
    const averageScore = details.reduce((acc, { baseScore }) => acc + baseScore, 0) / details.length;

    // Determine the severity color based on the average score
    let severityColor;
    if (averageScore < 4) {
        severityColor = 'green';
    } else if (averageScore <= 7) {
        severityColor = 'yellow';
    } else if (averageScore <= 9) {
        severityColor = 'orange';
    } else {
        severityColor = 'red';
    }

    let severityLevel;
    if (averageScore < 4) {
    severityLevel = 'LOW';
    } else if (averageScore <= 7) {
    severityLevel = 'MEDIUM';
    } else if (averageScore <= 9) {
    severityLevel = 'HIGH';
    } else {
    severityLevel = 'CRITICAL';
    }
    
    
    return (
      <Box display="flex" flexDirection="row" justifyContent="center" alignItems="center" mb={10}> {/* Increase mb for more space */}
        <Paper elevation={3} sx={{ 
          p: 2, 
          position: 'absolute', 
          zIndex: 2, 
          left: isRightSide ? '60%' : 'auto', 
          right: isRightSide ? 'auto' : '60%',
          maxWidth: 'calc(50% - 40px)', // Ensure the Paper doesn't overlap with the icons
          textAlign: isRightSide ? 'right' : 'left', // Align text to the left or right
        }}>
          <Typography variant="h6" component="span">
            {title}
          </Typography>
          <Typography>{`Number of CVEs: ${details.length}`}</Typography>
        </Paper>
        <Tooltip title={severityLevel}>
            <LensRoundedIcon sx={{ 
            color: severityColor, 
            zIndex: 1, 
            position: 'absolute', 
            fontSize: '3rem', // Increase the font size for a larger icon
            left: isRightSide ? 'calc(50% - 20px)' : 'auto', // Adjust the position for the icon
            right: isRightSide ? 'auto' : 'calc(50% - 20px)', // Adjust the position for the icon
            cursor: 'pointer', // Change the cursor to a pointer
                '&:hover': {
                color: 'white',
                transform: 'scale(1.3)', // Slightly increase size on hover
                },
            }} onClick={() => setIsPopupOpen(true)}  />
        </Tooltip>
        {/* Popup Component */}
        <SeverityDistributionPopup 
        open={isPopupOpen} 
        onClose={() => setIsPopupOpen(false)} 
        severities={details.map(detail => ({ value: detail.baseSeverity, count: 1 }))}
        />
      </Box>
    );
  };


const CpeTimeline: React.FC<{ cpeData: { [cpe: string]: any[] } }> = ({ cpeData }) => {
  const arrowWidth = '40px'; // Width of the "shaft" of the arrow
  
  return (
    <Box sx={{ position: 'relative', width: '100%', pt: 3 }}>
      {/* This Box creates the orange arrow shape */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          width: arrowWidth,
          bgcolor: '#f7b267',
          transform: 'translateX(-50%)',
          zIndex: 0,
          '&:before, &:after': {
            content: '""',
            position: 'absolute',
            height: '100%',
            width: '100%',
            background: 'linear-gradient(180deg, #f7b267 0%, #f79d65 50%, #f4845f 100%)',
          },
          '&:before': { // Creates the left side of the arrow
            left: `calc(-${arrowWidth} / 2)`,
            transformOrigin: 'top left',
            transform: 'skewY(30deg)',
          },
          '&:after': { // Creates the right side of the arrow
            right: `calc(-${arrowWidth} / 2)`,
            transformOrigin: 'top right',
            transform: 'skewY(-30deg)',
          }
        }}
      />
      {Object.entries(cpeData).map(([cpe, details], index) => (
        <TimelineItem key={cpe} title={cpe} details={details} index={index} />
      ))}
    </Box>
  );
};

export default CpeTimeline;
