import React, {useState} from "react";
import {styled} from "@mui/system";

import SeverityBreakdown from "./severity-breakdown";
import {TableCell, TableRow, Icon} from "@mui/material";
import {categoriseCve, categoriseMemSafeCve, mitigated} from "./severity-map";

import {ExpandLess, ExpandMore} from "@mui/icons-material";
import {type SbomComponent} from "@nqminds/cyber-demonstrator-client";
import CveTable from "./cve-table";
import {uniqBy} from "lodash";

const Controls = styled(Icon)(({theme: {palette}}) => ({
  background: palette.text.primary,
  borderRadius: 15,
  color: palette.background.paper,
  alignItems: "center",
  justifyContent: "center",
  width: "50px",
}));

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

  const categorisedCves = data.cves.map(categoriseCve);
  const categorisedMemSafeCves = categorisedCves.map(categoriseMemSafeCve);

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
        <TableCell align="center">
          {
            categorisedMemSafeCves.filter(
              ({baseSeverity}) => baseSeverity !== mitigated,
            ).length
          }
        </TableCell>
        <SeverityBreakdown cves={categorisedMemSafeCves} />
        <TableCell align="center" sx={{alignItems: "center"}}>
          <Controls>{open ? <ExpandLess /> : <ExpandMore />}</Controls>
        </TableCell>
      </Row>
      <CveTable open={open} cves={uniqBy(categorisedCves, "id")} />
    </>
  );
}

type props = {
  data: SbomComponent;
  highlight?: boolean;
};
