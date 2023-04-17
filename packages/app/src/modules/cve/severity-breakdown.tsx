import React from "react";

import {groupBy} from "lodash";
import {styled} from "@mui/material/styles";
import {TableCell, Typography} from "@mui/material";
import {severityColourMap} from "./severity-map";

const Container = styled("div")(() => ({
  width: "100%",
  minWidth: "300px",
  display: "flex",
  border: "1px solid black",
  height: "25px",
  flexDirection: "row-reverse",
  borderRadius: "15px",
  overflow: "clip",
}));

const SeverityBar = styled("div")(({theme: {menu}}) => ({
  display: "flex",
  flexGrow: "1",
  justifyContent: "center",
  alignItems: "center",
  color: menu.appBarText,
  fontWeight: "bold",
  textAlign: "center",
}));

type noNulls = NonNullable<cve["baseSeverity"]>;
const severityCategories = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
  "NONE",
] as noNulls[];

export default function SeverityBreakdown({cves}: props) {
  if (!cves.length) {
    return <TableCell colSpan={2} />;
  }
  const bySeverity = groupBy(cves, "baseSeverity");

  return (
    <TableCell colSpan={2}>
      <Container>
        {severityCategories.map((cat) => {
          const percentage =
            ((bySeverity[cat]?.length / cves.length) * 100) | 0;
          if (percentage) {
            return (
              <SeverityBar
                key={cat}
                sx={{
                  background: severityColourMap(cat),
                  width: `${percentage}%`,
                }}
              >
                <Typography>{bySeverity[cat]?.length}</Typography>
              </SeverityBar>
            );
          }
          return null;
        })}
      </Container>
    </TableCell>
  );
}

type props = {
  cves: cve[];
};
