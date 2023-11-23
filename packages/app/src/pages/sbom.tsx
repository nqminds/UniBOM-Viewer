import React from "react";
import SbomComponentTable from "@/modules/cve/sbom-component-table";
import {
  Box,
  CircularProgress,
  Typography,
  Button,
  Alert,
  TextField,
  Card,
  Grid,
} from "@mui/material";
import {styled} from "@mui/system";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import {useState, useEffect} from "react";
import {Paper} from "@nqminds/ui-components";

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

const UploadContainer = styled("div")({
  width: "100%",
  display: "flex",
  justifyContent: "flex-end",
});

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nistApiKey, setNistApiKey] = useState("");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [showAlertNist, setShowAlertNist] = useState(false);
  const [showAlertOpenai, setShowAlertOpenai] = useState(false);
  const [showAlertWrongFileType, setShowAlertWrongFileType] = useState(false);

  // Load any saved API keys when the component mounts
  useEffect(() => {
    const savedNistKey = sessionStorage.getItem("nistApiKey");
    const savedOpenaiKey = sessionStorage.getItem("openaiApiKey");
    if (savedNistKey) setNistApiKey(savedNistKey);
    if (savedOpenaiKey) setOpenaiApiKey(savedOpenaiKey);
  }, []);

  // Save API keys to sessionStorage when they are updated
  useEffect(() => {
    if (nistApiKey) sessionStorage.setItem("nistApiKey", nistApiKey);
  }, [nistApiKey]);

  useEffect(() => {
    if (openaiApiKey) sessionStorage.setItem("openaiApiKey", openaiApiKey);
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

    // Check for CycloneDx JSON file
    if (file.type !== "application/json" || !file.name.endsWith(".json")) {
      setShowAlertWrongFileType(true);
      setUploadedFile(null);
      setIsLoading(false);
      return;
    }

    if (!nistApiKey) {
      setShowAlertNist(true);
      return;
    }
    if (!openaiApiKey) {
      setShowAlertOpenai(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <React.Fragment>
      <Paper>
        <Grid
          container
          spacing={2}
          columns={2}
          alignItems="center"
          justifyContent="flex-start"
          width="100%"
          rowSpacing={1}
          columnSpacing={{xs: 1, sm: 2}}
        >
          <Grid item xs={1}>
            <TextField
              fullWidth
              label="NIST API Key"
              variant="outlined"
              type="password"
              value={nistApiKey}
              onChange={(err) => setNistApiKey(err.target.value)}
              helperText={
                <span>
                  Don't have a key? Get it from{" "}
                  <a
                    href="https://nvd.nist.gov/developers/request-an-api-key"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    here
                  </a>
                  .
                </span>
              }
              sx={{m: 1}}
            />
          </Grid>
          <Grid item xs={1}>
            <TextField
              fullWidth
              label="OpenAI API Key"
              variant="outlined"
              type="password"
              value={openaiApiKey}
              onChange={(err) => setOpenaiApiKey(err.target.value)}
              helperText={
                <span>
                  Don't have a key? Get it from{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    here
                  </a>
                  .
                </span>
              }
              sx={{m: 1}}
            />
          </Grid>
        </Grid>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error.message || "An unknown error occurred"}
          </Alert>
        )}
        {showAlertNist && (
          <Alert severity="warning" onClose={() => setShowAlertNist(false)}>
            Please enter NIST API key!
          </Alert>
        )}
        {showAlertOpenai && (
          <Alert severity="info" onClose={() => setShowAlertOpenai(false)}>
            Using an OpenAi key helps for a better classification of weaknesses!
          </Alert>
        )}
        {showAlertWrongFileType && (
          <Alert
            severity="warning"
            onClose={() => setShowAlertWrongFileType(false)}
          >
            Invalid file type. Only CycloneDx JSON files are allowed!
          </Alert>
        )}
        <UploadContainer>
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
              style={{display: "none"}}
            />
          </Button>
        </UploadContainer>
      </Paper>
      {isLoading && (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
        >
          <CircularProgress />
          <Typography variant="subtitle1" sx={{mt: 2}}>
            Loading CVE data...
          </Typography>
        </Box>
      )}
      {uploadedFile && (
        <Box sx={{p: 2}}>
          <Card variant="outlined" sx={{p: 2}}>
            {data ? (
              <SbomComponentTable data={data} />
            ) : (
              <Typography>No data available</Typography>
            )}
          </Card>
        </Box>
      )}
    </React.Fragment>
  );
}
