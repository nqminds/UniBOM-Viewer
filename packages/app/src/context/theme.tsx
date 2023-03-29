import React from "react";
import PropTypes from "prop-types";
import { createContext, useContext, useState } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";

import lightTheme from "@/styles/theme/lightTheme";
import darkTheme from "@/styles/theme/darkTheme";

const Context = createContext({});

export function ThemeProvider({ children }: any) {
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
  const Context = createContext<[themeType: "light" | "dark", setTheme: (theme: string) => void]>(["light", () => {}]);

  return Context;
}
