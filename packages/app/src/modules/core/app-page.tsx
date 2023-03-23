import type { AppProps} from 'next/app'
import {styled} from "@mui/system";
import AppBanner from "./banner";

const App = styled("div")(() => ({
  display: "flex",
  flexDirection: "column",
  height: "100%",
}));

const Content = styled("div")(({theme: {breakpoints}}) => ({
  display: "flex",
  flex: 1,
  overflow: "hidden",
  [breakpoints.down("xs")]: {
    flexDirection: "column-reverse",
    justifyContent: "space-between",
  },
  height: "100%",
}));

const Page = styled("div")(() => ({
  overflow: "auto",
  overflowX: "hidden",
  flex: 1,
  height: "100%",
}));


export default function AppPage({Component, pageProps} : any) {
  return (
    <App>
      <AppBanner />
      <Content>
        <Page>
          <Component {...pageProps} />
        </Page>
      </Content>
    </App>
  )
}