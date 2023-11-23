import React from 'react';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

function ApiKeyTextField({ label, value, onChange, link }: props) {
  return (
    <Grid item xs={1}>
      <TextField
        fullWidth
        label={label}
        variant="outlined"
        type="password"
        value={value}
        onChange={(evt) => onChange(evt.target.value)}
        helperText={
          <span>
            Dont have a key?{' '}
            <a href={link} target="_blank" rel="noopener noreferrer">
              get it from here
            </a>
            .
          </span>
        }
        sx={{ m: 1 }}
      />
    </Grid>
  );
}

type props = {
  label: string;
  value: string;
  onChange: (ard0: string) => null;
  link: string;
};

export default ApiKeyTextField;