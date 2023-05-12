import {useEffect, useState, useRef, MutableRefObject} from "react";

import {styled} from "@mui/material/styles";
import {Paper, IconButton} from "@mui/material";
import {red, amber, lightGreen} from "@mui/material/colors";

import {Delete, Circle} from "@mui/icons-material";
import {AxiosError} from "axios";

const TerminalContainer = styled(Paper)(({theme: {spacing, terminal}}) => ({
  marginBottom: spacing(2),
  background: terminal.background,
  height: 600,
  overflowY: "scroll",
}));

const DecorativeBar = styled("div")(({theme: {spacing, terminal}}) => ({
  height: spacing(4),
  background: terminal.bar,
  paddingRight: spacing(2),
  position: "sticky",
  top: 0,
  left: 0,
  justifyContent: "space-between",
  display: "flex",
}));

const DecorativeControls = styled(Circle)(({theme: {spacing}}) => ({
  fontSize: "1rem",
  margin: spacing(1),
  marginRight: 0,
}));

const ClearTerminal = styled(IconButton)(({theme: {spacing, terminal}}) => ({
  fontSize: "1rem",
  margin: spacing(1),
  marginRight: 0,
  color: terminal.text,
}));

const TerminalOutput = styled("pre")(({theme: {spacing, terminal}}) => ({
  padding: spacing(2),
  color: terminal.text,
  display: "block",
  paddingBottom: 0,
  paddingTop: 0,
  margin: 0,
  whiteSpace: "pre-wrap",
}));

function scrollIntoView(divRef: MutableRefObject<null | HTMLDivElement>) {
  if (divRef.current !== null) {
    divRef.current.scrollIntoView({behavior: "smooth"});
  }
}

function formatOutput(output: string) {
  // Add tab space to begining of output, add tab spaces to all newlines
  const tab = "\t";
  return output.replace(/^/, tab).replaceAll("\n", `\n${tab}`);
}

export default function Terminal({data, error, isLoading}: props) {
  const divRef = useRef(null);
  const [terminalDisplay, setTerminalDisplay] = useState<string[]>([]);

  useEffect(() => {
    if (isLoading) {
      return; // data/error is out of date, waiting to get new data/error
    }

    if (data) {
      const display = [...terminalDisplay];

      display.push(`> ${data.stdin}`);
      if (data.stdout) {
        display.push(formatOutput(data.stdout));
      }
      // TODO: Temporarily remove STDERR from the terminal for the purposes of demoing
      // if (data.stderr) {
      //   display.push(formatOutput(data.stderr));
      // }
      setTerminalDisplay(display);
    } else if (error) {
      let errorMessage;
      if (
        error instanceof AxiosError &&
        typeof error.response?.data === "string"
      ) {
        errorMessage = error.response?.data;
      } else {
        errorMessage = error.message;
      }
      setTerminalDisplay([...terminalDisplay, `ERROR: ${errorMessage}`]);
    }
  }, [data, typeof data, isLoading, error]);

  useEffect(() => {
    if (terminalDisplay.length > 0) {
      scrollIntoView(divRef);
    }
  }, [terminalDisplay]);

  return (
    <TerminalContainer>
      <DecorativeBar>
        <div>
          <DecorativeControls sx={{color: red[500]}} />
          <DecorativeControls sx={{color: amber[500]}} />
          <DecorativeControls sx={{color: lightGreen[400]}} />
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
  data?: TerminalData;
  error?: Error;
  isLoading: boolean;
};

type TerminalData = {
  stdin: string;
  stdout: string;
  stderr: string;
};
