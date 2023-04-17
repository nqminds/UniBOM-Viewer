import React from "react";

import SeverityBreakdown from "./severity-breakdown";
import {TableCell, TableRow} from "@mui/material";
import {classifySeverityScore} from "./severity-map";

function categoriseCves(props: cve) {
  const {baseScore, baseSeverity, version} = props;
  if (!baseSeverity) {
    return {...props, baseSeverity: classifySeverityScore(baseScore, version)};
  }
  return props;
}

export default function SbomComponentTableRow({data, highlight = false}: props) {
  const formattedCves = data.cves.map(categoriseCves);
  const defaultCves = formattedCves;
  const memorySafeCves = formattedCves.filter(({cwes}) => !cwes.find(({memoryCwe}) => memoryCwe));

  return (
    <>
      <TableRow className={highlight ? "highlighted-row" : undefined} onClick={() => open(data.id)}>
        <TableCell>{data.name}</TableCell>
        <TableCell align="right">{data.version}</TableCell>
        <TableCell>{data.licenses}</TableCell>
        <TableCell align="center">{defaultCves.length}</TableCell>
        <SeverityBreakdown cves={defaultCves} />
        <TableCell align="center">{memorySafeCves.length}</TableCell>
        <SeverityBreakdown cves={memorySafeCves} />
      </TableRow>
    </>
  );
}

type props = {
  data: sbomComponent;
  highlight?: boolean;
}
