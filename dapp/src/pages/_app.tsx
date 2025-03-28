import type { AppProps } from "next/app";
import Head from "next/head";
import Web3Provider from "../components/Web3Provider";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer"; // Updated to use the custom Footer component
import "../styles/global.css";
import { Layout } from "antd";

const { Content } = Layout;

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Web3Provider>
      <Head>
        <title>AutoInsure | Decentralized Flight Insurance</title>
        <meta name="description" content="Decentralized flight delay insurance powered by blockchain and Chainlink oracles" />
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

export default MyApp;
