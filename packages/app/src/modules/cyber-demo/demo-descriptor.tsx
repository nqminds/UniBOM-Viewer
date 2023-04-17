import {Typography} from "@mui/material";
import {Paper} from "@/modules/common";
import Image from "next/image";

export default function DemoDescriptor() {
  return (
    <Paper>
      <h1>Interactive Demo description</h1>
      <Typography>
        This demo shows how the same exploit issued against a PureCap version of
        OpenSSL on a Morello CPU, actively defends against exploits the same
        exploit on an unprotected system results in unprotected memory based
        exploit.
      </Typography>
      <Image
        src="/ssh-design.svg"
        alt="OpenSSL memory protection diagram"
        width={800}
        height={400}
        priority
      />
    </Paper>
  );
}
