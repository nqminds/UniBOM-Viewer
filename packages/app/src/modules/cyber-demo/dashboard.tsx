import {styled} from "@mui/system";
import DemoDescriptor from "./demo-descriptor";
import InfoPane from "./info-pane";
import ServerRequestControls from "./server-request-controls";
import Terminal from "./terminal";
import axios from "axios";

import {NewsReel} from "../morello-news";

import {useState} from "react";

const fetcher = async ([purecap, goodCert]: [boolean, boolean]) => {
  const response = await axios(`/api/morello/${purecap}/${goodCert}`);
  const json = response.data;
  if (typeof json !== "object" || json === null) {
    throw new Error(`Expected response to be an object but was: ${json}`);
  }
  if (json.error) {
    throw new Error(json.error);
  }
  return json as {stdin: string; stdout: string; stderr: string};
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

// designed to follow the useSWR API
type APIRequest = {
  data?: Awaited<ReturnType<typeof fetcher>>;
  error?: Error;
  isLoading: boolean;
};

export default function Dashboard() {
  const [apiRequest, setApiRequest] = useState<APIRequest>({
    isLoading: false,
  });

  async function mutateRequest(purecap: boolean, goodCert: boolean) {
    setApiRequest({data: undefined, error: undefined, isLoading: true});
    try {
      const result = await fetcher([purecap, goodCert]);
      setApiRequest({data: result, error: undefined, isLoading: false});
    } catch (error) {
      setApiRequest({data: undefined, error: error as Error, isLoading: false});
    }
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
