import React from "react";

import {
  Alert
} from "@mui/material";

function Warning({error, severity, closeWarning, message} : props) {

  if(error !== null && error !== false) {
    return (
      <Alert
        severity={severity}
        onClose={()=> closeWarning()}
      >
        {message}
      </Alert>
    )
  }
  return null;


}

type props = {
  error: Error | boolean | null;
  severity: "warning" | "error" | "info";
  closeWarning: () => void;
  message: string;
};

export default Warning;
