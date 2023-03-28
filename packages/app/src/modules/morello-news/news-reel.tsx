import { useState, useEffect } from "react";
import newsReel from "./articles";
import { styled } from "@mui/system";
import Excerpt from "./excerpt";
import Image from "next/image";
import { Paper, IconButton } from "@mui/material";
import { ArrowForwardIos, ArrowBackIos } from "@mui/icons-material";

const News = styled(Paper)(() => ({
  display: "flex",
  flexDirection: "row",
  height: "100%",
}));

const Container = styled("div")(({ theme: { spacing } }) => ({
  display: "grid",
  gridTemplateColumns: "1fr 2fr",
  alignSelf: "center",
  columnGap: 0,
}));

const ImageContainer = styled("div")(({ theme: { spacing } }) => ({
  justifyContent: "center",
  display: "flex",
  padding: spacing(1),
  alignItems: "center",
}));

const Button = styled(IconButton)(({ theme: { palette } }) => ({
  position: "relative",
  alignSelf: "center",
  color: palette.text.secondary,
}));

const Next = styled(Button)(({ theme: { palette } }) => ({
  justifySelf: "end",
}));

export default function NewsReel() {
  const [articleNumber, setArticleNumber] = useState(0);
  const [currentArticle, setCurrentArticle] = useState(newsReel[0]);

  function nextArticle(newNumber: number) {
    if (newNumber >= newsReel.length) {
      setArticleNumber(0);
    } else if (newNumber < 0) {
      setArticleNumber(newsReel.length - 1);
    } else {
      setArticleNumber(newNumber);
    }
  }

  useEffect(() => {
    const interval = setTimeout(() => {
      nextArticle(articleNumber + 1);
    }, 10000);
    return () => clearTimeout(interval);
  }, [articleNumber]);

  useEffect(() => {
    setCurrentArticle(newsReel[articleNumber]);
  }, [articleNumber]);

  return (
    <News>
      <Button onClick={() => nextArticle(articleNumber - 1)}>
        <ArrowBackIos />
      </Button>
      <Container>
        <ImageContainer>
          <Image
            src={currentArticle.imagery}
            alt={currentArticle.imagery}
            width={300}
            height={300}
          />
        </ImageContainer>
        <Excerpt {...currentArticle} />
      </Container>
      <Next onClick={() => nextArticle(articleNumber + 1)}>
        <ArrowForwardIos />
      </Next>
    </News>
  );
}
