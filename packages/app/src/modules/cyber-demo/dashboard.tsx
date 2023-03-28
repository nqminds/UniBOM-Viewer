import { styled } from "@mui/system";
import DemoDescriptor from "./demo-descriptor";
import InfoPane from "./info-pane";
import ServerRequestControls from "./server-request-controls";
import Terminal from "./terminal";

import { NewsReel } from "../morello-news";

import useSWR from "swr";
import { useState } from "react";

const fetcher = (fetchParams: boolean[]) =>
  fetch(`/api/morello/${fetchParams.join("/")}`).then((r) => r.json());

const Container = styled("div")(({ theme: { spacing } }) => ({
  padding: spacing(2),
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  overflowX: "hidden",
}));

const DemoContainer = styled("div")(({ theme: { spacing } }) => ({
  display: "grid",
  gridTemplateColumns: "2fr 3fr",
  width: "85%",
  alignSelf: "center",
  columnGap: spacing(2),
  marginBottom: spacing(2),
}));

export default function Dashboard() {
  const [fetchParams, setFetchParams] = useState<boolean[]>([]);

  const apiRequest = useSWR(fetchParams, fetcher);
  function mutateRequest(purecap: boolean, goodCert: boolean) {
    setFetchParams([purecap, goodCert]);
    apiRequest.mutate();
  }

  return (
    <Container>
      <DemoContainer>
        <InfoPane />
        <NewsReel />
      </DemoContainer>
      <ServerRequestControls
        mutateRequest={mutateRequest}
        loading={apiRequest.isLoading}
      />
      <DemoContainer>
        <Terminal apiRequest={apiRequest} />
        <DemoDescriptor />
      </DemoContainer>
    </Container>
  );
}
