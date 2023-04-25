import {Link, Typography} from "@mui/material";
import {Paper} from "@/modules/common";

export default function InfoPane() {
  return (
    <Paper sx={{marginBottom: 0}}>
      <h1>OpenSSL Morello protection</h1>
      <Typography paragraph>
        <Link href="https://nvd.nist.gov/vuln/detail/CVE-2022-3602">
          <dfn>CVE-2022-3602</dfn>
        </Link>{" "}
        is a recent OpenSSL vulnerability, causing significant disruption in the
        cybersecurity space due it's potential to be used for a remote code
        execution exploit.
        <br />
      </Typography>
      <Typography paragraph>
        <Link href="https://www.cl.cam.ac.uk/research/security/ctsrd/cheri/">
          <dfn>CHERI</dfn>
        </Link>{" "}
        is a novel computer architecture, supporting a novel <abbr>ISA</abbr>
        (Instruction set architecture) that protects against memory/pointer
        errors.
      </Typography>
      <Typography paragraph>
        ARM's{" "}
        <Link href="https://www.arm.com/architecture/cpu/morello">
          <dfn>Morello</dfn>
        </Link>{" "}
        is optimised research silicon that implements the CHERI instruction set.
      </Typography>
      <Typography paragraph>
        The practical question: can existing software be deployed to a
        Morello-CPU-based system which actively defends against common memory
        exploits.
      </Typography>
    </Paper>
  );
}
