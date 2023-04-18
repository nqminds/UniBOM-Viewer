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
    name: "Morello Purecap",
    description: (
      <>
        <Typography>
          Sends the given certificates to an OpenSSL v3.0.2 server running on
          Morello in Purecap (Pure-capability) mode.
        </Typography>
        <Typography>
          The malicious certificate will attempt to run a stack buffer overflow.
          However, the pointer to the buffer has been tagged with the a
          capability that lists the size of the buffer. Attempting to overflow
          the buffer will violate the stack pointer capabilities, resulting in
          the CPU throwing a SIGPROT CHERI protection violation.
        </Typography>
      </>
    ),
    controls: [
      {
        name: "Safe Cert",
        mutateParams: [true, true],
      },
      {
        name: "Malicious Cert",
        mutateParams: [true, false],
      },
    ],
  },
  {
    name: "Morello Hybrid",
    description: (
      <>
        <Typography>
          Sends the given certificates to an OpenSSL v3.0.2 server running on
          Morello in Hybrid (hybrid-capability) mode.
        </Typography>
        <Typography>
          As Morello runs CheriBSD (a fork of FreeBSD v14), Address Space Layout
          Randomization is enabled and binaries are compiled with stack
          protection canaries (such as `-fstack-protector`). Therefore,
          attempting to exploit CVE-2022-3602 will normally result in the OS
          catching the attempted buffer overflow, and aborting the process with
          an 'SIGABRT'.
        </Typography>
      </>
    ),
    controls: [
      {
        name: "Safe Cert",
        mutateParams: [false, true],
      },
      {
        name: "Malicious Cert",
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
          {description}
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
