import {useState} from "react";
import newsReel from "./articles";
import {styled} from "@mui/system";
import Excerpt from "./excerpt";
import Image from "next/image";
import {Paper, IconButton, MobileStepper, useTheme} from "@mui/material";
import {KeyboardArrowLeft, KeyboardArrowRight} from "@mui/icons-material";

/**
 * Code adapted from https://mui.com/material-ui/react-stepper/#text-with-carousel-effect
 *
 * SPDX-FileCopyrightText: © 2023 Nquiringminds Ltd.
 * SPDX-FileCopyrightText: Copyright (c) 2014 Call-Em-All
 * SPDX-License-Identifier: MIT License
 */

// @ts-expect-error No types, but we can use react-swipeable-views types
import SwipeableViews from "react-swipeable-views-react-18-fix";
import {autoPlay} from "react-swipeable-views-utils";

const AutoPlaySwipeableViews = autoPlay(
  SwipeableViews as typeof import("react-swipeable-views").default,
);

const News = styled(Paper)(() => ({
  display: "flex",
  flexDirection: "column",
  height: "100%",
}));

const Container = styled("div")(() => ({
  display: "grid",
  gridTemplateColumns: "1fr 2fr",
  alignSelf: "center",
  columnGap: 0,
}));

const ImageContainer = styled("div")(({theme: {spacing}}) => ({
  justifyContent: "center",
  display: "flex",
  padding: spacing(1),
  alignItems: "center",
}));

const Button = styled(IconButton)(({theme: {palette}}) => ({
  position: "relative",
  alignSelf: "center",
  color: palette.text.secondary,
}));

export default function NewsReel() {
  const theme = useTheme();
  const [articleNumber, setArticleNumber] = useState(0);

  function nextArticle(newNumber: number) {
    if (newNumber >= newsReel.length) {
      setArticleNumber(0);
    } else if (newNumber < 0) {
      setArticleNumber(newsReel.length - 1);
    } else {
      setArticleNumber(newNumber);
    }
  }

  return (
    <News>
      <AutoPlaySwipeableViews
        axis={theme.direction === "rtl" ? "x-reverse" : "x"}
        index={articleNumber}
        onChangeIndex={(x: number) => setArticleNumber(x)}
        interval={10000} /* Move every 10 seconds */
        enableMouseEvents
      >
        {newsReel.map((article, index) => (
          <div key={article.name}>
            {Math.abs(articleNumber - index) <= 2 ? (
              <Container>
                <ImageContainer>
                  <Image
                    src={article.imagery}
                    alt={article.imagery}
                    width={300}
                    height={300}
                  />
                </ImageContainer>
                <Excerpt {...article} />
              </Container>
            ) : null}
          </div>
        ))}
      </AutoPlaySwipeableViews>
      <MobileStepper
        steps={newsReel.length}
        position="static"
        activeStep={articleNumber}
        nextButton={
          <Button
            size="small"
            onClick={() => nextArticle(articleNumber + 1)}
            disabled={articleNumber === newsReel.length - 1}
          >
            Next
            {theme.direction === "rtl" ? (
              <KeyboardArrowLeft />
            ) : (
              <KeyboardArrowRight />
            )}
          </Button>
        }
        backButton={
          <Button
            size="small"
            onClick={() => nextArticle(articleNumber - 1)}
            disabled={articleNumber === 0}
          >
            {theme.direction === "rtl" ? (
              <KeyboardArrowRight />
            ) : (
              <KeyboardArrowLeft />
            )}
            Back
          </Button>
        }
      />
    </News>
  );
}
