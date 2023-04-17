import React from "react";

import {Paper} from "@/modules/common";
import {Table, TableBody} from "@mui/material";
import SbomComponentTableHead from "./sbom-component-table-head";
import SbomComponentTableRow from "./sbom-component-table-row";

import {uniqBy, sortBy} from "lodash";

export default function SbomComponentTable({data}: props) {
  const allComponents = data.reduce((iterator: sbomComponent, component: sbomComponent) => {
    const concatCves = uniqBy([...iterator.cves, ...component.cves], "id");
    return {...iterator, cves: concatCves};
  }, {name: "All components", version: "", licenses: "", cves: [], id: undefined});

  return (
    <Paper>
      <Table size="small">
        <SbomComponentTableHead />
        <TableBody>
          {sortBy(data, ({cves}) => -cves.length).map((row) => <SbomComponentTableRow data={row} key={row.id} />)}
          <SbomComponentTableRow data={allComponents} highlight/>
        </TableBody>
      </Table>
    </Paper>
  );
}

type props = {
  data: sbomComponent[];
}
