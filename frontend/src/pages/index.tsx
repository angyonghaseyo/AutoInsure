import React from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../components/Web3Provider';
import PurchasePolicy from '../components/PurchasePolicy';

const HomePage: React.FC = () => {
  const { account, network } = useWeb3();

  return (
    <div className="max-w-screen-xl mx-auto">
      <section className="py-12 mb-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Decentralized Flight Delay Insurance
          </h1>
          <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
            Instant payouts, transparent claims process, and no middlemen.
            Powered by blockchain technology.
          </p>
          {account ? (
            <Link
              to="/policies"
              className="bg-white text-indigo-600 font-bold py-3 px-6 rounded-lg shadow-md hover:bg-gray-100 transition-colors duration-300"
            >
              View My Policies
            </Link>
          ) : (
            <button
              className="bg-white text-indigo-600 font-bold py-3 px-6 rounded-lg shadow-md hover:bg-gray-100 transition-colors duration-300"
              onClick={() => {
                // Scroll to connect wallet section
                document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Get Started
            </button>
          )}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="bg-blue-100 text-blue-800 w-12 h-12 flex items-center justify-center rounded-full mb-4 font-bold text-xl">1</div>
            <h3 className="text-xl font-bold mb-2">Purchase Insurance</h3>
            <p className="text-gray-600">
              Connect your wallet and purchase insurance for your flight by paying a small premium.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="bg-blue-100 text-blue-800 w-12 h-12 flex items-center justify-center rounded-full mb-4 font-bold text-xl">2</div>
            <h3 className="text-xl font-bold mb-2">Flight Data Oracle</h3>
            <p className="text-gray-600">
              Our smart contracts use Chainlink oracles to monitor flight status from reliable data sources.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="bg-blue-100 text-blue-800 w-12 h-12 flex items-center justify-center rounded-full mb-4 font-bold text-xl">3</div>
            <h3 className="text-xl font-bold mb-2">Automatic Payout</h3>
            <p className="text-gray-600">
              If your flight is delayed by more than 2 hours, you'll receive an automatic payout to your wallet.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Key Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Instant Payouts
            </h3>
            <p className="text-gray-600">
              No claim forms or waiting periods. Receive your payout directly to your wallet as soon as a delay is confirmed.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Transparent & Secure
            </h3>
            <p className="text-gray-600">
              All policies and claims are recorded on the blockchain, providing complete transparency and security.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              No Hidden Fees
            </h3>
            <p className="text-gray-600">
              Pay only for the coverage you need. No administration fees, no hidden charges. Everything is transparent.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Fast & Efficient
            </h3>
            <p className="text-gray-600">
              Purchase insurance in seconds and receive payouts automatically. No paperwork, no hassle.
            </p>
          </div>
        </div>
      </section>

      <section id="get-started" className="mb-16">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-8">Get Started</h2>
          
          {!account ? (
            <div className="text-center mb-8">
              <p className="text-xl mb-4">
                Connect your wallet to purchase flight delay insurance
              </p>
              <div className="flex justify-center">
                {/* Wallet connect button would be shown in the Navbar component */}
                <p>Please use the Connect Wallet button in the navbar to get started.</p>
              </div>
            </div>
          ) : !network.isSupported ? (
            <div className="text-center bg-red-100 text-red-700 p-4 rounded-md mb-8">
              <p className="text-lg mb-2">
                Please switch to a supported network
              </p>
              <p>
                Currently on: <strong>{network.name}</strong>
              </p>
              <p className="mt-2">
                Supported networks: Ethereum Mainnet, Sepolia Testnet, Polygon Mainnet, Mumbai Testnet
              </p>
            </div>
          ) : (
            <PurchasePolicy />
          )}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">FAQ</h2>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200 p-6">
            <h3 className="text-xl font-bold mb-2">How does the insurance payout work?</h3>
            <p className="text-gray-600">
              If your flight is delayed by more than 2 hours, our smart contract automatically triggers a payout to your wallet. The payout amount is typically 3x your premium, capped at a maximum limit.
            </p>
          </div>
          <div className="border-b border-gray-200 p-6">
            <h3 className="text-xl font-bold mb-2">What happens if my flight is cancelled?</h3>
            <p className="text-gray-600">
              Flight cancellations are treated the same as delays and will trigger the payout if they're confirmed by our oracle data sources.
            </p>
          </div>
          <div className="border-b border-gray-200 p-6">
            <h3 className="text-xl font-bold mb-2">How do you verify flight delays?</h3>
            <p className="text-gray-600">
              We use Chainlink oracles that fetch data from reliable flight information providers. This ensures the data is accurate and tamper-proof.
            </p>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold mb-2">Can I cancel my policy?</h3>
            <p className="text-gray-600">
              Yes, you can cancel your policy before the flight departure time and receive a 50% refund of your premium.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;