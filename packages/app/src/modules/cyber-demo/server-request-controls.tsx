/* eslint-disable max-len */
import {styled} from "@mui/material/styles";
import {Paper} from "../common";
import {Typography, Button, Divider} from "@mui/material";

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

const StyledDivider = styled(Divider)(({theme: {spacing}}) => ({
  marginTop: spacing(1),
  marginBottom: spacing(1),
}));

const StyledSamp = styled("samp")(({theme: {spacing, terminal}}) => ({
  backgroundColor: terminal.background,
  paddingTop: spacing(0.2),
  paddingBottom: spacing(0.2),
  paddingLeft: spacing(0.4),
  paddingRight: spacing(0.4),
  borderRadius: "4px",
  fontSize: "90%",
}));

const servers = [
  {
    name: "Morello Purecap",
    description: (
      <>
        <Typography paragraph>
          Sends the given certificates to an OpenSSL v3.0.2 server running on{" "}
          <strong>Morello in Purecap (Pure-capability) mode</strong>.
        </Typography>
        <Typography>
          The malicious certificate will attempt to run a stack buffer overflow.
          However, the pointer to the buffer has been tagged with the a CHERI
          capability that lists the size of the buffer. Attempting to overflow
          the buffer will violate the stack pointer capabilities, resulting in
          the CPU preventing the instruction from running, and throwing a{" "}
          <code>SIGPROT</code> CHERI protection violation.
        </Typography>
        <StyledDivider />
        <Typography variant="subtitle1">
          Expected behavior with malicious certificates:
        </Typography>
        <ul>
          <Typography component="li">
            Buffer overflow is prevented by the CPU
          </Typography>
          <Typography component="li">
            OpenSSL server is killed with <code>SIGPROT</code>
          </Typography>
          <li>
            <Typography>
              Bash shell catches <code>SIGPROT</code> and prints
            </Typography>
            <StyledSamp>
              In-address space security exception (core dumped)
            </StyledSamp>
          </li>
        </ul>
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
        <Typography paragraph>
          Sends the given certificates to an OpenSSL v3.0.2 server running on{" "}
          <strong>Morello in Hybrid (hybrid-capability) mode</strong>.
        </Typography>
        <Typography>
          As Morello runs CheriBSD (a fork of FreeBSD v14), Address Space Layout
          Randomization is enabled and binaries are compiled with stack
          protection canaries (such as `-fstack-protector`). Therefore, even
          without using CHERI capabilites, most trivial stack overflows will
          normally be caught automatically.
        </Typography>
        <Typography>
          As the payload in our malicious certificate is quite basic, it cannot
          bypass the stack canary, and so the buffer overflow will be detected,
          and the process will be aborted with a <code>SIGABRT</code> signal.
        </Typography>
        <StyledDivider />
        <Typography variant="subtitle1">
          Expected behavior with malicious certificates:
        </Typography>
        <ul>
          <Typography component="li">
            Stack buffer overflow is detected by stack canaries
          </Typography>
          <Typography component="li">
            OpenSSL server is killed with <code>SIGABRT</code>
          </Typography>
          <li>
            <Typography>
              Bash shell catches <code>SIGABRT</code> and prints
            </Typography>
            <StyledSamp>Abort trap (core dumped)</StyledSamp>
          </li>
        </ul>
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
