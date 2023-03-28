import { Paper } from "@mui/material";
import { styled } from "@mui/system";

const StyledPaper = styled(Paper)(({ theme: { spacing } }) => ({
  overflow: "auto",
  padding: spacing(2),
  marginBottom: spacing(2),
}));

export default function PaperComponent({ children, sx }: props) {
  return <StyledPaper sx={sx}>{children}</StyledPaper>;
}

type props = {
  children?: string | JSX.Element | JSX.Element[];
  sx?: object;
};
