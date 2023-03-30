/* eslint-disable max-len */
import {styled} from "@mui/system";
import {Paper} from "../common";
import {Typography, Button} from "@mui/material";

const Container = styled("div")(({theme: {spacing}}) => ({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  width: "85%",
  alignSelf: "center",
  columnGap: spacing(2),
}));

const ButtonContainer = styled("div")(() => ({
  display: "flex",
  justifyContent: "center",
}));

const servers = [
  {
    name: "Morello",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In magna urna, suscipit quis tincidunt vel, accumsan ut lacus. Donec malesuada eu nulla a laoreet. Praesent vehicula nisi sit amet sodales luctus. Donec eu ipsum ipsum. Nulla mollis scelerisque justo sit amet elementum.",
    controls: [
      {
        name: "Cert",
        mutateParams: [true, true],
      },
      {
        name: "No cert",
        mutateParams: [true, false],
      },
    ],
  },
  {
    name: "Ubuntu / \"normal server here\"",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In magna urna, suscipit quis tincidunt vel, accumsan ut lacus. Donec malesuada eu nulla a laoreet. Praesent vehicula nisi sit amet sodales luctus. Donec eu ipsum ipsum. Nulla mollis scelerisque justo sit amet elementum.",
    controls: [
      {
        name: "Cert",
        mutateParams: [false, true],
      },
      {
        name: "No cert",
        mutateParams: [false, false],
      },
    ],
  },
];

export default function ServerRequestControls({mutateRequest, loading}: props) {
  return (
    <Container>
      {servers.map(({name, description, controls}) => (
        <Paper key={`server-${name}`}>
          <h2>{name}</h2>
          <Typography>{description}</Typography>
          <Container>
            {controls.map(({name: buttonName, mutateParams}) => (
              <ButtonContainer key={`${name}-control-${buttonName}`}>
                <Button
                  variant="contained"
                  onClick={() => mutateRequest(...mutateParams)}
                  startIcon=">"
                  disabled={loading}
                >
                  {buttonName}
                </Button>
              </ButtonContainer>
            ))}
          </Container>
        </Paper>
      ))}
    </Container>
  );
}

type props = {
  mutateRequest: (...rest: boolean[]) => void;
  loading: boolean;
};
