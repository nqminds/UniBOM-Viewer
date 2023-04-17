import {Typography} from "@mui/material";
import {Paper} from "@/modules/common";

export default function InfoPane() {
  return (
    <Paper sx={{marginBottom: 0}}>
      <h1>OpenSSL Morello protection</h1>
      <Typography>
        CVE-2022-3602 is a recent OpenSSL exploit, causing significant disruption in the cybersecurity
        space due to a suspected widespread remote code execution exploit
        CHERI is a novel computer architecture, supporting a novel ISA
        (Instruction set architecture) that protects against memory/pointer errors
        Morello is optimised research silicon that implements the CHERI instruction set.
        The practical question: can existing software be deployed to a Morello CPU based
        system which actively defends against common memory exploits
      </Typography>
    </Paper>
  );
}
