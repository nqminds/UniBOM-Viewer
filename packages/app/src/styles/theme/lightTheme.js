import { createTheme } from "@mui/material/styles";
import themeConstants from "./theme-constants";

import { blueGrey, lightBlue, blue, grey } from "@mui/material/colors";

const colours = {
  public: {
    primary: lightBlue,
    secondary: blueGrey,
    text: blue,
  },
};

const colour = colours.public; // Choose colour scheme here based off e.g. profile initialised in boot

const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: colour.primary,
    secondary: colour.secondary,
    background: {
      paper: "#ffffff",
      default: grey[200],
      terminal: "#c9d1d9",
      terminalBar: "#92a2b3",
    },
    text: {
      hint: colour.text[100],
      icon: colour.text[600],
      primary: colour.text[800],
      secondary: colour.text[400],
      terminal: colour.primary[900],
    },
    ...themeConstants,
  },
});

export default lightTheme;
