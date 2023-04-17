import React from "react";
import {TableCell, TableHead, TableRow} from "@mui/material";
import {styled} from "@mui/system";

const Cell = styled(TableCell)(() => ({
  fontWeight: "bold",
  fontSize: "16px",
}));

const defaultHeaderProps:cellProps = {
  colSpan: 1,
  rowSpan: 2,
  align: "center",
};

const groupHeaderProps:cellProps = {
  colSpan: 3,
  rowSpan: 1,
  align: "center",
};

const primaryHeaders = [
  {key: "Component", ...defaultHeaderProps},
  {key: "Version", ...defaultHeaderProps},
  {key: "license(s)", ...defaultHeaderProps},
  {key: "Memory unprotected system", ...groupHeaderProps},
  {key: "Memory protected system", ...groupHeaderProps},
];

const cveHeaders = [
  {key: "Number of vulnerabilities"},
  {key: "Severity breakdown", colSpan: 2},
];

export default function SbomComponentTableHead() {
  return (
    <TableHead>
      <TableRow>
        {primaryHeaders.map((props) => <Cell {...props}>{props.key}</Cell>)}
      </TableRow>
      <TableRow>
        {cveHeaders.map((props) => <Cell align="center" {...props}>{props.key}</Cell>)}
        {cveHeaders.map((props) => <Cell align="center" {...props}>{props.key}</Cell>)}
      </TableRow>
    </TableHead>
  );
}

type cellProps = {
  colSpan: number,
  rowSpan: number,
  align: "left" | "center" | "right" | "justify" | "inherit" | undefined
}
