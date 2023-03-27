import {Typography} from "@mui/material";
import {Paper} from "@/modules/common";

export default function DemoDescriptor() {
  return(
    <Paper>
      <h1>Interactive Demo description</h1>
      <Typography>
        Basically, what does the terminal ouput mean? 
        Might be good to get a few diagrams in
      </Typography>
    </Paper>
  )
}