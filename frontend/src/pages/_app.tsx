import type { AppProps } from "next/app";
import Head from "next/head";
import Web3Provider from "../components/Web3Provider";
import Navbar from "../components/Navbar";
import "../styles/global.css";
import { Layout } from "antd";

const { Content, Footer } = Layout;

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Web3Provider>
      <Head>
        <title>AutoInsure | Decentralized Flight Insurance</title>
        <meta name="description" content="Decentralized flight delay insurance powered by blockchain and Chainlink oracles" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout style={{ minHeight: "100vh" }}>
        <Navbar />
        <Content style={{ padding: "20px 50px", marginTop: "64px" }}>
          <Component {...pageProps} />
        </Content>
        <Footer style={{ textAlign: "center" }}>AutoInsure © {new Date().getFullYear()}</Footer>
      </Layout>
    </Web3Provider>
  );
}

export default MyApp;
