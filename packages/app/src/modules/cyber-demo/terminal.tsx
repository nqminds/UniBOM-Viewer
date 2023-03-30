import { useEffect, useState, useRef, useCallback } from "react";

import { styled } from "@mui/material/styles";
import { Paper, IconButton, Typography } from "@mui/material";
import { red, amber, lightGreen } from "@mui/material/colors";

import { Delete, Circle } from "@mui/icons-material";

const TerminalContainer = styled(Paper)(
  ({ theme: {spacing, terminal}}) => ({
    marginBottom: spacing(2),
    background: terminal.background,
    minHeight: 500,
    overflowY: "scroll",
    height: 500,
  })
);

const DecorativeBar = styled("div")(
  ({ theme: {spacing, terminal}}) => ({
    height: spacing(4),
    background: terminal.bar,
    paddingRight: spacing(2),
    position: "sticky",
    top: 0,
    left: 0,
    justifyContent: "space-between",
    display: "flex",
  })
);

const DecorativeControls = styled(Circle)(({ theme: {spacing} }) => ({
  fontSize: "1rem",
  margin: spacing(1),
  marginRight: 0,
}));

const ClearTerminal = styled(IconButton)(
  ({ theme: {spacing, terminal} }) => ({
    fontSize: "1rem",
    margin: spacing(1),
    marginRight: 0,
    color: terminal.text,
  })
);

const TerminalOutput = styled("pre")(
  ({ theme: {spacing, terminal} }) => ({
    padding: spacing(2),
    color: terminal.text,
    display: "block",
    paddingBottom: 0,
    paddingTop: 0,
    margin: 0,
    whiteSpace: "pre-wrap",
  })
);

function formatOutput(output: string) {
  // Add tab space to begining of output, add tab spaces to all newlines
  const tab = "\t";
  return output.replace(/^/, tab).replaceAll("\n", `\n${tab}`);
}

export default function Terminal({ apiRequest = undefined }: props) {
  const divRef: any = useRef(null);
  const [terminalDisplay, setTerminalDisplay] = useState<string[]>([]);

  useEffect(() => {
    if (apiRequest) {
      const { data } = apiRequest;

      if (data?.error) {
        setTerminalDisplay([...terminalDisplay, data.error.message]);
        divRef.current.scrollIntoView({ behavior: "smooth" });
      } else if (data) {
        const display: any = terminalDisplay;
        display.push(`> ${data.input}`);
        display.push(formatOutput(data.stdout));
        if (data.stderr) {
          display.push(formatOutput(data.stderr));
        }
        setTerminalDisplay(display);
        divRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [apiRequest]);

  return (
    <TerminalContainer>
      <DecorativeBar>
        <div>
          <DecorativeControls sx={{ color: red[500] }} />
          <DecorativeControls sx={{ color: amber[500] }} />
          <DecorativeControls sx={{ color: lightGreen[400] }} />
        </div>
        <ClearTerminal onClick={() => setTerminalDisplay([])}>
          <Delete />
        </ClearTerminal>
      </DecorativeBar>
      {terminalDisplay.map((newLine, index) => (
        <TerminalOutput key={`terminal-${index}`}>{newLine}</TerminalOutput>
      ))}
      <TerminalOutput ref={divRef}>{">"} |</TerminalOutput>
    </TerminalContainer>
  );
}

type props = {
  apiRequest?: {
    data?: {
      input: string;
      stdout: string;
      stderr: string;
      error: { message: string };
    };
    error?: object;
    isLoading: boolean;
  };
};
