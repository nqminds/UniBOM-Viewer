import React from "react";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";

function ApiKeyTextField({
  label,
  value,
  onChange,
  link,
  disabledMessage,
}: props) {
  // A disabled message replaces the input with a notice that the feature is off
  const disabled = Boolean(disabledMessage);
  return (
    <Grid item xs={1} minWidth={"50%"}>
      <TextField
        fullWidth
        label={label}
        variant="outlined"
        type="password"
        value={disabled ? "" : value ?? ""}
        disabled={disabled}
        onChange={(evt) => onChange?.(evt.target.value)}
        helperText={
          disabled ? (
            disabledMessage
          ) : (
            <span>
              Dont have a key?{" "}
              <a href={link} target="_blank" rel="noopener noreferrer">
                get it from here
              </a>
              .
            </span>
          )
        }
        sx={{m: 1}}
      />
    </Grid>
  );
}

type props = {
  label: string;
  value?: string;
  onChange?: (ard0: string) => void;
  link: string;
  disabledMessage?: string;
};

export default ApiKeyTextField;
