import { styled } from "@mui/system";
import { Paper, Typography } from "@mui/material";
import {red, amber, lightGreen} from "@mui/material/colors"

import CircleIcon from '@mui/icons-material/Circle';

const TerminalContainer = styled(Paper)(({theme: {palette, spacing}}) => ({
  overflow: "auto",
  marginBottom: spacing(2),
  background:  palette.background.terminal,
  minHeight: 500,
}))

const DecorativeBar = styled("div")(({theme: {palette, spacing}}) => ({
  height: spacing(4),
  background: palette.background.terminalBar,
  paddingRight: spacing(2)
}))

const DecorativeControls = styled(CircleIcon)(({theme: {spacing}}) => ({
  fontSize: "1rem",
  margin: spacing(1),
  marginRight: 0,
}));

const TerminalOutput = styled(Typography)(({theme: {palette, spacing}}) => ({
  padding: spacing(2),
  color: palette.text.terminal
}))


export default function Terminal() {
  return(
    <TerminalContainer>
      <DecorativeBar>
        <DecorativeControls sx={{color: red[500]}} />
        <DecorativeControls sx={{color: amber[500]}} />
        <DecorativeControls sx={{color: lightGreen[400]}}/>
      </DecorativeBar>
      <TerminalOutput>
        {'>'} |
      </TerminalOutput>
    </TerminalContainer>
  )
}