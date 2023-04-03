import "@/styles/globals.css";
import type {AppProps} from "next/app";

import {CssBaseline} from "@mui/material";

import {ThemeProvider} from "@/context/theme";

import AppPage from "@/modules/core/app-page";

export default function App({Component, pageProps}: AppProps) {
  return (
    <ThemeProvider>
      <CssBaseline />
      <AppPage Component={Component} pageProps={pageProps} />
    </ThemeProvider>
  );
}
