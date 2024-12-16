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

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [nistApiKey, setNistApiKey] = useState<string>("");
  const [openaiApiKey, setOpenaiApiKey] = useState<string>("");
  const [showAlertNist, setShowAlertNist] = useState<boolean>(false);
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
      const parsedData = JSON.parse(savedData);
      setData(parsedData);
      setUploadedFile(parsedData);
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
      setUploadedFile(response);
      setData(response);
      sessionStorage.setItem("sbomData", JSON.stringify(response)); // Store data in session storage
    } catch (err) {
      setError(err as ApiError);
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
          message={error?.body || error?.message || "An unknown error occurred"}
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
