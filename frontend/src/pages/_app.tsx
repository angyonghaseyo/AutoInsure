import type { AppProps } from 'next/app';
import Web3Provider from '../components/Web3Provider';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/global.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Web3Provider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Component {...pageProps} />
        </main>
        <Footer />
      </div>
    </Web3Provider>
  );
}

export default MyApp;