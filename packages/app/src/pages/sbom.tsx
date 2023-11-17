import React from "react";
import SbomComponentTable from "@/modules/cve/sbom-component-table";
import {Box, CircularProgress, Typography, Button, Alert, TextField, Card, Grid, Snackbar} from "@mui/material";
import {styled} from "@mui/system";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import {useState,useEffect} from "react";

const Container = styled("div")(({theme: {spacing}}) => ({
  padding: spacing(2),
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  overflowX: "hidden",
}));

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nistApiKey, setNistApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');

   // Load any saved API keys when the component mounts
   useEffect(() => {
    const savedNistKey = sessionStorage.getItem('nistApiKey');
    const savedOpenaiKey = sessionStorage.getItem('openaiApiKey');
    if (savedNistKey) setNistApiKey(savedNistKey);
    if (savedOpenaiKey) setOpenaiApiKey(savedOpenaiKey);
  }, []);

   // Save API keys to sessionStorage when they are updated
   useEffect(() => {
    if (nistApiKey) sessionStorage.setItem('nistApiKey', nistApiKey);
  }, [nistApiKey]);

    useEffect(() => {
      if (openaiApiKey) sessionStorage.setItem('openaiApiKey', openaiApiKey);
  }, [openaiApiKey]);


  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event?.target?.files?.[0];
    if (!file) {
      <Alert severity="warning">No file selected!</Alert>;
      setUploadedFile(null); // reset the uploaded file state
      setIsLoading(false); // reset the loading state
      return;
    }
    if (!nistApiKey || !openaiApiKey) {
      alert("Please enter both NIST and OpenAI API keys.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("nistApiKey", nistApiKey);
    formData.append("openaiApiKey", openaiApiKey);
    try {
      const response = await fetch("/api/vulnerability-analysis", {
        method: "POST",
        body: formData,
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
        setError(new Error("An unknown error occurred"));
      }
      <Alert severity="error">
        Error uploading file: {(err as Error).message}!
      </Alert>;
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return <Typography>ERROR {error.message}</Typography>;
  }
  
  return (
    <React.Fragment>
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="flex-start">
          <Grid item>
            <Button
              component="label"
              variant="contained"
              color="primary"
              startIcon={<CloudUploadIcon />}
              disabled={isLoading}
            >
              Upload JSON SBOM
              <VisuallyHiddenInput
                type="file"
                onChange={handleFileUpload}
                accept=".json"
                style={{ display: "none" }}
              />
            </Button>
          </Grid>
          <Grid item>
            <TextField
              label="NIST API Key"
              variant="outlined"
              type="password"
              value={nistApiKey}
              onChange={(err) => setNistApiKey(err.target.value)}
              helperText={
                <span>
                  Don't have a key? Get it from {" "}
                  <a href="https://nvd.nist.gov/developers/request-an-api-key" target="_blank" rel="noopener noreferrer">
                    here
                  </a>.
                </span>
              }
              sx={{ m: 1}}
            />
          </Grid>
          <Grid item>
            <TextField
              label="OpenAI API Key"
              variant="outlined"
              type="password"
              value={openaiApiKey}
              onChange={(err) => setOpenaiApiKey(err.target.value)}
              helperText={
                <span>
                  Don't have a key? Get it from {" "}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                    here
                  </a>.
                </span>
              }
              sx={{ m: 1}}
            />
          </Grid>
        </Grid>
      </Box>
      {isLoading && (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
        >
          <CircularProgress />
          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            Loading CVE data...
          </Typography>
        </Box>
      )}
      {uploadedFile && (
        <Box sx={{ p: 2 }}>
          <Card variant="outlined" sx={{ p: 2 }}>
            {data ? <SbomComponentTable data={data} /> : <Typography>No data available</Typography>}
          </Card>
        </Box>
      )}
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error || "An unknown error occurred"}
        </Alert>
      </Snackbar>
    </React.Fragment>
  );  
}
