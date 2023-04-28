import React from "react";
import useSWR from "swr";
import SbomComponentTable from "@/modules/cve/sbom-component-table";
import {Box, CircularProgress, Typography} from "@mui/material";
import {styled} from "@mui/system";

const fetcher = async () => {
  const response = await fetch("/api/vulnerability-analysis");
  return await response.json();
};

const Container = styled("div")(({theme: {spacing}}) => ({
  padding: spacing(2),
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  overflowX: "hidden",
}));

export default function Home() {
  const {data, error, isLoading} = useSWR("vul-analysis", fetcher);

  if (error || data?.error) {
    return <Typography>ERROR</Typography>;
  }

  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="start"
        alignItems="center"
        minHeight="100vh"
      >
        <Typography variant="h2">Loading CVE data</Typography>
        <Typography variant="subtitle1" marginBottom={2}>
          This may take a while until the latest data has been downloaded.
        </Typography>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container>
      <SbomComponentTable data={data} />
    </Container>
  );
}
