import React from "react";
import { Documentation } from "@/modules/cli";
import { Typography } from "@mui/material";
import {Paper} from "@/modules/common";

export default function Home() {


  return (
    <React.Fragment>
      <Paper sx={{margin: 5, marginBottom: 0}}>
        <Typography>
        The SBOM Analysis Platform is an essential resource for software developers and security experts seeking to get profound understanding of their software's 
        constituent parts. Users may upload a Software Bill of Materials (SBOM) to get a comprehensive overview of every component's details,
        including version, licensing, and related vulnerabilities.
        <br/>
        Understanding the importance of security, our platform highlights critical details, such as the severity score of vulnerabilities,
        common weakness enumerations, and the state of the memory protection system. The colour-coded severity breakdown makes it easy to
        prioritise actions based on the risk level—red for critical, orange for high, and so on—providing a clear and immediate visual cue of
        potential security issues.
        <br/>
        For each component, the system lists the number of vulnerabilities and divides them into unprotected and protected memory systems,
        allowing for a dual perspective on security. With the added convenience of a direct link to the National Vulnerability Database (NVD)
        for more detailed information, our users have all the resources they need to make informed decisions about their software's security posture.
        </Typography>
        <a
        href="/example-sbom.json"
        download
        className="bg-blue-600 text-white py-2 px-4 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-colors"
        >
          Download example SBOM 
        </a>
      </Paper>

      <Documentation/>
    </React.Fragment>
  );
}
