import { Button, Divider as MuiDivider, Typography } from "@mui/material";
import { styled } from "@mui/system";

import {useRouter} from 'next/router';

const Container = styled("div")(({theme: {spacing}}) => ({
  padding: spacing(2),
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  height: "100%"
}));

const Header = styled("h2")(() => ({
  marginBottom: 0,
  paddingBottom: 0,
  marginTop: 0
}));

const Subheader = styled("h5")(({theme: {palette}}) => ({
  marginTop: 0,
  color: palette.text.secondary
}));

const ButtonContainer = styled("div")(({theme:{spacing}}) => ({
  display: "flex",
  justifyContent: "center",
  flexDirection: "column",
}))

const Divider = styled(MuiDivider)(({theme: {palette, spacing}}) => ({
  margin: spacing(1),
  borderColor: palette.text.secondary,
  opacity: 0.5
}))

export default function Excerpt({name, publisher, published, excerpt, link}:props) {
  const router = useRouter();

  return (
    <Container>
      <div>
        <Header>{name}</Header>
        <Subheader>{published}, {publisher}</Subheader>
        <Typography>
          {excerpt}
        </Typography>
      </div>
      <ButtonContainer>
        <Divider />
        <Button endIcon=">" onClick={() => router.push(link)}>Read more</Button>
      </ButtonContainer>
    </Container>
  )
}

type props = {
  name: string,
  publisher: string,
  published: string,
  excerpt: string,
  link: string,
}