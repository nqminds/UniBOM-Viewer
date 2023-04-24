import React, {useState} from "react";
import {styled} from "@mui/system";

import SeverityBreakdown from "./severity-breakdown";
import {TableCell, TableRow, Icon} from "@mui/material";
import {classifySeverityScore} from "./severity-map";

import {ExpandLess, ExpandMore} from "@mui/icons-material";
import CveTable from "./cve-table";

const Controls = styled(Icon)(({theme: {palette}}) => ({
  background: palette.text.primary,
  borderRadius: 15,
  color: palette.background.paper,
  alignItems: "center",
  justifyContent: "center",
  width: "50px",
}));

function categoriseCves(props: cve) {
  const {baseScore, baseSeverity, version} = props;
  if (!baseSeverity) {
    return {...props, baseSeverity: classifySeverityScore(baseScore, version)};
  }
  return props;
}

export default function SbomComponentTableRow({
  data,
  highlight = false,
}: props) {
  const [open, setOpen] = useState(false);

  function expand(currentState: boolean) {
    setOpen(!currentState);
  }

  const Row = styled(TableRow)(({theme: {palette}}) => ({
    cursor: "pointer",
    background: highlight ? palette.background.default : null,
  }));

  const categorisedCves = data.cves.map(categoriseCves);
  const memorySafeCves = categorisedCves.filter(
    ({cwes}) => !cwes.find(({memoryCwe}) => memoryCwe),
  );

  return (
    <>
      <Row
        className={highlight ? "highlighted-row" : undefined}
        onClick={() => expand(open)}
      >
        <TableCell>{data.name}</TableCell>
        <TableCell align="right">{data.version}</TableCell>
        <TableCell>{data.licenses}</TableCell>
        <TableCell align="center">{categorisedCves.length}</TableCell>
        <SeverityBreakdown cves={categorisedCves} />
        <TableCell align="center">{memorySafeCves.length}</TableCell>
        <SeverityBreakdown cves={memorySafeCves} />
        <TableCell align="center" sx={{alignItems: "center"}}>
          <Controls>{open ? <ExpandLess /> : <ExpandMore />}</Controls>
        </TableCell>
      </Row>
      <CveTable open={open} cves={categorisedCves} />
    </>
  );
}

type props = {
  data: sbomComponent;
  highlight?: boolean;
};
