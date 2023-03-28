import React from "react";
import PropTypes from "prop-types";
import { createContext, useContext, useState } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";

import lightTheme from "@/styles/theme/lightTheme";
import darkTheme from "@/styles/theme/darkTheme";

const Context = createContext({});

/**
 * Theme provider
 *
 * @param {object} props - react props
 * @param {Array.<object>} props.children - child components
 * @returns {object} - theme provider
 */
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

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Use theme context hook
 *
 * @returns {object} - theme context
 */
export function useThemeContext() {
  // Fix for Typescript error
  return useContext(Context) as any[];
}
