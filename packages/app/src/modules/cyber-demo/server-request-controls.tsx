import {styled} from "@mui/system";
import {Paper} from "../common";
import {Typography, Button} from "@mui/material";

const Container = styled("div")(({theme: {spacing}}) => ({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  width: "85%",
  alignSelf: "center",
  columnGap: spacing(2),
}));

const ButtonContainer = styled("div")(() => ({
  display: "flex",
  justifyContent: "center",
}))

export default function ServerRequestControls() {
  const servers = [
    {
      name: "Morello",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In magna urna, suscipit quis tincidunt vel, accumsan ut lacus. Donec malesuada eu nulla a laoreet. Praesent vehicula nisi sit amet sodales luctus. Donec eu ipsum ipsum. Nulla mollis scelerisque justo sit amet elementum.",
      controls: [
        {
          name: "Cert",
          onClick: () => console.log("Cert")
        },
        {
          name: "No cert",
          onClick: () => console.log("No cert")
        }
      ]
    },
    {
      name: `Ubuntu / "normal server here"`,
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In magna urna, suscipit quis tincidunt vel, accumsan ut lacus. Donec malesuada eu nulla a laoreet. Praesent vehicula nisi sit amet sodales luctus. Donec eu ipsum ipsum. Nulla mollis scelerisque justo sit amet elementum.",
      controls: [
        {
          name: "Cert",
          onClick: () => console.log("Cert")
        },
        {
          name: "No cert",
          onClick: () => console.log("No cert")
        }
      ]
    }
  ];
  
  return (
    <Container>
      {servers.map(({name, description, controls}) => 
        <Paper key={`server-${name}`}>
          <h2>{name}</h2>
          <Typography>{description}</Typography>
          <Container>
            {controls.map(({name, onClick}) => (
              <ButtonContainer key={`${name}-control-${name}`}>
                <Button variant="contained" onClick={onClick} startIcon=">">
                  {name}
                </Button>
              </ButtonContainer>
            ))}
          </Container>
        </Paper>
      )}
    </Container>
  )
}