import {styled} from "@mui/system";
import DemoDescriptor from "./demo-descriptor";
import InfoPane from "./info-pane";
import ServerRequestControls from "./server-request-controls";
import Terminal from "./terminal";

const Container = styled("div")(({theme: {spacing}}) => ({
  padding: spacing(2),
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  overflowX: "hidden",
}))

const DemoContainer = styled("div")(({theme: {spacing}}) => ({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  width: "85%",
  alignSelf: "center",
  columnGap: spacing(2),
}))

export default function Datshboard() {
  return (
    <Container>
      <InfoPane />
      <ServerRequestControls />
      <DemoContainer>
        <DemoDescriptor />
        <Terminal />
      </DemoContainer>
    </Container>
  )
}