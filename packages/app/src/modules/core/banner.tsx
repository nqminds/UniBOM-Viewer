import React from "react";
import Image from "next/image";

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
      <Image
        src="/nquiringminds.svg"
        alt="Nquiringminds Logo"
        width={180}
        height={37}
        priority
      />
      <div>
        <Menu />
      </div>
    </AppTitleContainer>
  );
}
