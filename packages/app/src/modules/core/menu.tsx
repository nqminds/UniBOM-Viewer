"use client";

import React from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import { useThemeContext } from "@/context/theme";

import { styled } from "@mui/material/styles";
import { IconButton, useTheme } from "@mui/material";
import { LightMode, Nightlight } from "@mui/icons-material";

const routes = [{ url: "", name: "Home", associatedUrls: ["/"] }];

const Container = styled("div")(() => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "flex-end",
}));

const MenuItem = styled("div")(
  ({ theme: {spacing, menu}}) => ({
    display: "flex",
    alignItems: "center",
    marginRight: spacing(2),
    cursor: "pointer",
    color: menu.appBarText,
  })
);

const MenuButton = styled(IconButton)(
  ({ theme: {menu} }) => ({
    color: menu.appBarText,
  })
);

export default function Menu() {
  const router = useRouter();
  const [themeType, setTheme] = useThemeContext();
  const {menu} = useTheme();
  const toggleTheme = () =>
    themeType === "light" ? setTheme("dark") : setTheme("light");

  return (
    <Container>
      {routes.map(({ associatedUrls, name, url }) => (
        <MenuItem
          key={url}
          sx={{
            color: [url, ...associatedUrls].find(
              (route) => router.route === route
            )
              ? menu.menuHighlight
              : undefined,
          }}
        >
          <Link href={`/${url}`}>{name}</Link>
        </MenuItem>
      ))}
      <MenuButton onClick={toggleTheme}>
        {themeType === "light" ? <Nightlight /> : <LightMode />}
      </MenuButton>
    </Container>
  );
}
