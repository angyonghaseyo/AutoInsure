import type { AppProps } from "next/app";
import Head from "next/head";
import Web3Provider from "../components/Web3Provider";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Layout } from "antd";
import "../styles/global.css";

const { Content } = Layout;

const App = ({ Component, pageProps }: AppProps) => {
  const siteTitle = "AutoInsure | Decentralized Flight Insurance";
  const siteDescription = "Decentralized flight delay insurance powered by blockchain and Chainlink oracles";

  return (
    <Web3Provider>
      <Head>
        <title>{siteTitle}</title>
        <meta name="description" content={siteDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Layout style={{ minHeight: "100vh" }}>
        <Navbar />

        <Content style={{ padding: "20px 50px", marginTop: "64px" }}>
          <Component {...pageProps} />
        </Content>

        <Footer />
      </Layout>
    </Web3Provider>
  );
}

export default App;
