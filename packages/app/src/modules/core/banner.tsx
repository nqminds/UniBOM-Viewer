import React from "react";

import {styled} from "@mui/material/styles";

import Menu from "./menu";

const AppTitleContainer = styled("div")(({theme: {spacing, menu}}) => ({
  position: "sticky",
  top: 0,
  alignItems: "center",
  background: menu.appBarBackground,
  color: "white",
  display: "flex",
  justifyContent: "space-around",
  height: 75,
  padding: spacing(1),
  paddingLeft: spacing(3),
  paddingRight: spacing(3),
  width: "100%",
}));

export default function AppBanner() {
  return (
    <AppTitleContainer>
      <h3>SBOM Generation and Analysis Platform</h3>
      <div>
        <Menu />
      </div>
    </AppTitleContainer>
  );
}
