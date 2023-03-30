import React from "react";
import {createContext, useContext, useState} from "react";
import {ThemeProvider as MuiThemeProvider} from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Theme {
    terminal: {
      background: string;
      bar: string;
      text: string;
    };
    menu: {
      appBarBackground: string;
      appBarText: string;
      menuHighlight: string;
    };
  }
  interface ThemeOptions {
    terminal: {
      background: string;
      bar: string;
      text: string;
    };
    menu: {
      appBarBackground: string;
      appBarText: string;
      menuHighlight: string;
    };
  }
}

import lightTheme from "@/styles/theme/lightTheme";
import darkTheme from "@/styles/theme/darkTheme";

const Context = createContext<
[themeType: string, setTheme:(theme: string) => void]
  >(["light", () => null]);

export function ThemeProvider({children}: props) {
  const [themeType, setTheme] = useState("light");
  return (
    <Context.Provider value={[themeType, setTheme]}>
      <MuiThemeProvider theme={themeType === "dark" ? darkTheme : lightTheme}>
        {children}
      </MuiThemeProvider>
    </Context.Provider>
  );
}

export function useThemeContext() {
  return useContext(Context);
}

type props = {
  children: string | JSX.Element | JSX.Element[];
};
