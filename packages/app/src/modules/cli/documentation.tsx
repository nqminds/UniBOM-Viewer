import { Box, Link, Button } from '@mui/material';

export default function AnonymizedReadme() {
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      <iframe
        src="https://anonymous.4open.science/r/UniBOM-E7F7/README.md"
        style={{
          width: '90%',
          height: '75vh',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
        }}
        frameBorder="0"
        allowFullScreen
        title="Anonymized GitHub README"
      ></iframe>
      <Button
        href="https://anonymous.4open.science/r/UniBOM-E7F7/README.md"
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
      
        }}
      >
        Open in a new tab
      </Button>
    </Box>
  );
}
