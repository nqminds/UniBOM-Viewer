import React from "react";
import useSWR from "swr";
import SbomComponentTable from "@/modules/cve/sbom-component-table";
import {Typography} from "@mui/material";
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
  const {data, error} = useSWR("vul-analysis", fetcher);
  if (error || data?.error) {
    return <Typography>ERROR</Typography>;
  }
  if (!data) {
    return <>Loading</>;
  }

  return (
    <Container>
      <SbomComponentTable data={data} />
    </Container>
  );
}
