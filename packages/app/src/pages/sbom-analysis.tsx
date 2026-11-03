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

import {ApiError, NqmCyberAPI} from "@nqminds/cyber-demonstrator-client";
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

// The API sends errors as a string or as {error: string}; Alert can only render a string
function errorMessage(err: ApiError | Error | null): string {
  const body = err instanceof ApiError ? err.body : undefined;
  if (typeof body === "string" && body) return body;
  if (body?.error) return String(body.error);
  return err?.message || "An unknown error occurred";
}

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<sbomComponent[] | null>(
    null,
  );
  const [data, setData] = useState<sbomComponent[] | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [openaiApiKey, setOpenaiApiKey] = useState<string>("");
  const [showAlertOpenai, setShowAlertOpenai] = useState<boolean>(false);
  const [showAlertWrongFileType, setShowAlertWrongFileType] =
    useState<boolean>(false);

  // Load any saved API keys when the component mounts
  useEffect(() => {
    const savedOpenaiKey = sessionStorage.getItem("openaiApiKey");
    if (savedOpenaiKey) setOpenaiApiKey(savedOpenaiKey);
  }, []);

  useEffect(() => {
    if (openaiApiKey) sessionStorage.setItem("openaiApiKey", openaiApiKey);
  }, [openaiApiKey]);

  useEffect(() => {
    const savedData = sessionStorage.getItem("sbomData");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (!Array.isArray(parsedData)) throw new Error("Not an array");
        setData(parsedData);
        setUploadedFile(parsedData);
      } catch {
        // Drop a corrupt entry (e.g. "undefined") so the page loads
        sessionStorage.removeItem("sbomData");
      }
    }
  }, []);

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

    if (!openaiApiKey) {
      setShowAlertOpenai(true);
    }

    setIsLoading(true);
    try {
      const response = await nqmCyberApi.default.vulnerabilityAnalysis({
        file,
        openaiApiKey,
      });
      // The client returns undefined for an empty or non-JSON success response
      if (!Array.isArray(response)) {
        throw new Error("The server returned no analysis results. Try again.");
      }
      setUploadedFile(response);
      setData(response);
      sessionStorage.setItem("sbomData", JSON.stringify(response)); // Store data in session storage
    } catch (err) {
      setError(err as ApiError | Error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleApiKeyChange =
    (setter: (value: string) => void) => (value: string) => {
      const valueWithoutSpaces = value.replace(/\s/g, "");
      setter(valueWithoutSpaces);
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
            label="OpenAI API Key"
            value={openaiApiKey}
            onChange={handleApiKeyChange(setOpenaiApiKey)}
            link="https://platform.openai.com/api-keys"
          />
        </Grid>
        <Warning
          error={error}
          severity="error"
          closeWarning={() => setError(null)}
          message={errorMessage(error)}
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
