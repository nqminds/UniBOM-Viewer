import {styled} from "@mui/system";
import DemoDescriptor from "./demo-descriptor";
import InfoPane from "./info-pane";
import ServerRequestControls from "./server-request-controls";
import Terminal from "./terminal";
import axios from "axios";

import {NewsReel} from "../morello-news";

import useSWRImmutable from "swr/immutable";
import {useState} from "react";

const fetcher = async ([purecap, goodCert]: [boolean, boolean]) => {
  const response = await axios(`/api/morello/${purecap}/${goodCert}`);
  const json = response.data;
  // TODO: error codes are not being surfaced, infer if data is a string, it is an error
  if (typeof json === "string") {
    return {error: json};
  }
  return json;
};

const Container = styled("div")(({theme: {spacing}}) => ({
  padding: spacing(2),
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  overflowX: "hidden",
}));

const DemoContainer = styled("div")(({theme: {spacing}}) => ({
  display: "grid",
  gridTemplateColumns: "2fr 3fr",
  width: "85%",
  alignSelf: "center",
  columnGap: spacing(2),
  marginBottom: spacing(2),
}));

export default function Dashboard() {
  const [fetchParams, setFetchParams] = useState<[boolean, boolean] | null>(
    null,
  );

  const apiRequest = useSWRImmutable(fetchParams, fetcher);
  function mutateRequest(purecap: boolean, goodCert: boolean) {
    // reset current SWR cache without revalidating, so that a request is only
    // made if we come back to the same `fetchParams`.
    apiRequest.mutate(undefined, {revalidate: false});
    setFetchParams([purecap, goodCert]);
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
        <DemoDescriptor />
        <Terminal
          data={apiRequest.data}
          error={apiRequest.error}
          isLoading={apiRequest.isLoading}
        />
      </DemoContainer>
    </Container>
  );
}
