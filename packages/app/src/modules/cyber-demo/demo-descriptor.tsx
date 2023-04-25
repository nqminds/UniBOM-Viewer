import {Typography} from "@mui/material";
import {Paper} from "@/modules/common";
import Image from "next/image";

export default function DemoDescriptor() {
  return (
    <Paper>
      <h1>Interactive Demo description</h1>
      <Typography>This demo shows the same exploit issued against:</Typography>
      <ul>
        <Typography component="li">
          a PureCap version of OpenSSL on a Morello CPU, where the hardware
          actively defends against exploits.
        </Typography>
        <Typography component="li">
          a non-Purecap system, where protection relies on bypassable software
          guards.
        </Typography>
      </ul>
      <div>
        <Image
          src="/ssh-design.svg"
          alt="OpenSSL memory protection diagram"
          width={0}
          height={0}
          sizes="100vw"
          style={{width: "100%", height: "auto"}}
        />
      </div>
    </Paper>
  );
}
