import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import Web3Provider from '../components/Web3Provider';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/global.css';

function MyApp({ Component, pageProps }: AppProps) {
  // This effect adds critical styles to ensure proper display
  useEffect(() => {
    // Create a style element
    const style = document.createElement('style');
    style.textContent = `
      /* Global resets */
      * {
        box-sizing: border-box;
      }
      
      html, body, #__next {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow-x: hidden !important;
      }
      
      /* Fix mobile styles */
      @media (max-width: 767px) {
        #desktop-links {
          display: none !important;
        }
        #mobile-nav-button {
          display: block !important;
        }
      }
      
      @media (min-width: 768px) {
        #desktop-links {
          display: flex !important;
        }
        #mobile-nav-button {
          display: none !important;
        }
      }
      
      /* Override any conflicting styles */
      nav a, nav button {
        text-decoration: none !important;
      }
      
      /* Force horizontal layout */
      nav > div {
        width: 100% !important;
      }
      
      nav > div > div {
        display: flex !important;
        flex-direction: row !important;
        justify-content: space-between !important;
        align-items: center !important;
      }
    `;
    
    // Append the style element to the head
    document.head.appendChild(style);
    
    // Clean up function
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <Web3Provider>
      <Head>
        <title>AutoInsure | Decentralized Flight Insurance</title>
        <meta name="description" content="Decentralized flight delay insurance powered by blockchain and Chainlink oracles" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%'
      }}>
        <Navbar />
        <main style={{
          flexGrow: 1,
          width: '100%',
          maxWidth: '100%'
        }}>
          <Component {...pageProps} />
        </main>
        <Footer />
      </div>
    </Web3Provider>
  );
}

export default MyApp;