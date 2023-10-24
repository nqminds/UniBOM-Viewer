import React from "react";
import SbomComponentTable from "@/modules/cve/sbom-component-table";
import {Box, CircularProgress, Typography, Button, Alert} from "@mui/material";
import {styled} from "@mui/system";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useState } from "react";


const Container = styled("div")(({theme: {spacing}}) => ({
  padding: spacing(2),
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  overflowX: "hidden",
}));


const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});


export default function Home() {
  
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isGeneratePressed, setGeneratePressed] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0];
    if (!file) {
      <Alert severity="warning">No file selected!</Alert>
      return;
    }  
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/vulnerability-analysis", {
          method: "POST", 
          body: formData
      }); 
      if (response.ok) {
          const responseData = await response.json();
          setUploadedFile(responseData);
          setData(responseData);
      } else {
          const errorData = await response.text();
          setError(new Error(errorData));
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error('An unknown error occurred'));
      }
      <Alert severity="error">Error uploading file: {(err as Error).message}!</Alert>
    } finally {
      setIsLoading(false);
    }
  };


  if (error) {
    return <Typography>ERROR ${error.message}</Typography>;
  }

  if (!uploadedFile || !isGeneratePressed) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="start"
        alignItems="flex-start"
        minHeight="100vh"
        padding="20px 0 0 20px"
      >
        <Button 
        component="label" 
        variant="contained" 
        startIcon={<CloudUploadIcon />}
        style={{ marginBottom: '10px' }}
        >
          Upload json sbom
          <VisuallyHiddenInput type="file" onChange={handleFileUpload} accept=".json" />
        </Button>
        <Button 
          variant="contained" 
          onClick={() => setGeneratePressed(true)}
          disabled={!uploadedFile}  // Only enable if file is uploaded
        >
          Generate Vulnerability Report
        </Button>
        {isLoading && (
          <>
            <Typography variant="h2">Loading CVE data</Typography>
            <Typography variant="subtitle1" marginBottom={2}>
              This may take a while until the latest data has been downloaded.
            </Typography>
            <CircularProgress />
          </>
        )}
      </Box>
    );
  }
  
  return (
    <Container>
      {data ? <SbomComponentTable data={data} /> : <Typography>No data available</Typography>}
    </Container>
  );
}
