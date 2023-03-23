import { createTheme } from "@mui/material/styles";
import themeConstants from "./theme-constants";

import { blueGrey, grey, lightBlue, blue } from "@mui/material/colors";

const colours = {
  // Extra theme colours may be added here
  public: {
    primary: lightBlue,
    secondary: blueGrey,
    text: blue,
  },
};

const colour = colours.public; // Choose colour scheme here based off e.g. profile initialised in boot

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: colour.primary,
    secondary: colour.secondary,
    background: {
      paper: grey[900],
      default: "#4f4f4f",
    },
    text: {
      hint: colour.text[50],
      icon: colour.text[300],
      primary: colour.text[100],
      secondary: colour.text[300],
    },
    ...themeConstants,
  },
});

export default darkTheme;
