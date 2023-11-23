import React from "react";
import SbomComponentTable from "@/modules/cve/sbom-component-table";
import {
  Box,
  CircularProgress,
  Typography,
  Button,
  Alert,
  Card,
  Grid,
} from "@mui/material";
import {styled} from "@mui/system";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import {useState, useEffect} from "react";
import {Paper, ApiKeyTextField} from "@/modules/common";
import Warning from "@/modules/common/warning";

import {NqmCyberAPI} from "@nqminds/cyber-demonstrator-client";
const nqmCyberApi = new NqmCyberAPI({BASE: `/api`});

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [nistApiKey, setNistApiKey] = useState<string>("");
  const [openaiApiKey, setOpenaiApiKey] = useState<string>("");
  const [showAlertNist, setShowAlertNist] = useState<boolean>(false);
  const [showAlertOpenai, setShowAlertOpenai] = useState<boolean>(false);
  const [showAlertWrongFileType, setShowAlertWrongFileType] =
    useState<boolean>(false);

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
    try {
      const response = await nqmCyberApi.default.vulnerabilityAnalysis({
        file,
        nistApiKey,
        openaiApiKey,
      });
      setUploadedFile(response);
      setData(response);
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
          <ApiKeyTextField
            label="NIST API Key"
            value={nistApiKey}
            onChange={setNistApiKey}
            link="https://nvd.nist.gov/developers/request-an-api-key"
          />
          <ApiKeyTextField
            label="OpenAI API Key"
            value={openaiApiKey}
            onChange={setOpenaiApiKey}
            link="https://platform.openai.com/api-keys"
          />
        </Grid>
        <Warning
          error={error}
          severity="error"
          closeWarning={() => setError(null)}
          message={error?.message || "An unknown error occurred"}
        />
        <Warning
          error={showAlertNist}
          severity="warning"
          closeWarning={() => setShowAlertNist(false)}
          message={"Please enter NIST API key!"}
        />
        <Warning
          error={showAlertOpenai}
          severity="info"
          closeWarning={() => setShowAlertOpenai(false)}
          message={
            "Using an OpenAi key helps for a better classification of weaknesses!"
          }
        />
        <Warning
          error={showAlertWrongFileType}
          severity="warning"
          closeWarning={() => setShowAlertWrongFileType(false)}
          message={"Invalid file type. Only CycloneDx JSON files are allowed!!"}
        />
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
