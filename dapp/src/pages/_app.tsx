import type { AppProps } from "next/app";
import Head from "next/head";
import { Layout } from "antd";
import Web3Provider from "../components/Web3Provider";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/global.css";

const { Content } = Layout;

const App = ({ Component, pageProps }: AppProps) => {
  const siteTitle = "AutoInsure | Decentralized Travel Insurance";
  const siteDescription = "Decentralized travel insurance for flight delays and baggage loss, powered by blockchain and Chainlink oracles";

  return (
    <Web3Provider>
      <Head>
        <title>{siteTitle}</title>
        <meta name="description" content={siteDescription} />
      </Head>

      <Layout className="layout-container">
        <Navbar />
        <Content className="content-container">
          <Component {...pageProps} />
        </Content>
        <Footer />
      </Layout>
    </Web3Provider>
  );
}

export default App;
