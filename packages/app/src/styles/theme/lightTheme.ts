import {createTheme} from "@mui/material/styles";
import themeConstants from "./theme-constants";

import {blueGrey, lightBlue, blue, grey} from "@mui/material/colors";

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
    },
    text: {
      primary: colour.text[900],
      secondary: colour.text[400],
    },
  },
  terminal: {
    background: "#c9d1d9",
    bar: "#92a2b3",
    text: colour.primary[900],
  },
  ...themeConstants,
});

export default lightTheme;
