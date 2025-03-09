// pages/index.tsx
import React from 'react';
import Link from 'next/link';
import { Shield, Clock, DollarSign, Zap, ArrowRight, Check, AlertTriangle, Calendar, Plane } from 'lucide-react';
import { useWeb3 } from '../components/Web3Provider';
import PurchasePolicy from '../components/PurchasePolicy';

const CheckmarkIcon = ({ className = "text-blue-300" }) => (
  <span className="mr-2 flex-shrink-0" style={{ width: '12px', height: '12px', display: 'inline-flex' }}>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: '100%', maxHeight: '100%' }}>
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} />
    </svg>
  </span>
);

const HomePage: React.FC = () => {
  const { account, network } = useWeb3();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 py-20">
        <div className="absolute inset-0 bg-blue-900 opacity-20 pattern-diagonal-stripes pattern-white pattern-bg-transparent pattern-size-4"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Decentralized Flight Delay Insurance
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-lg">
                Instant payouts, transparent claims process, and no middlemen.
                Powered by blockchain technology.
              </p>
              {account ? (
                <Link
                  href="/policies"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 shadow-md transition duration-150"
                >
                  View My Policies
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              ) : (
                <button
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 shadow-md transition duration-150"
                  onClick={() => {
                    document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-3 w-3" />
                </button>
              )}
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="w-full max-w-md bg-white bg-opacity-10 backdrop-filter backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20 shadow-lg">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <Plane className="h-3 w-3" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Flight Delay Protection</h3>
                    <p className="text-blue-100">Secure your travel plans today</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center text-blue-100">
                    <CheckmarkIcon />
                    <span>Coverage for 2+ hour delays</span>
                  </div>
                  <div className="flex items-center text-blue-100">
                    <CheckmarkIcon />
                    <span>3x premium payout guarantee</span>
                  </div>
                  <div className="flex items-center text-blue-100">
                    <CheckmarkIcon />
                    <span>Automatic smart contract execution</span>
                  </div>
                  <div className="flex items-center text-blue-100">
                    <CheckmarkIcon />
                    <span>Trusted Chainlink oracle data feeds</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">Purchase Insurance</h3>
              <p className="text-gray-600 text-center">
                Connect your wallet and purchase insurance for your flight by paying a small premium.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">Flight Data Oracle</h3>
              <p className="text-gray-600 text-center">
                Our smart contracts use Chainlink oracles to monitor flight status from reliable data sources.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">Automatic Payout</h3>
              <p className="text-gray-600 text-center">
                If your flight is delayed by more than 2 hours, you'll receive an automatic payout to your wallet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Key Benefits</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="text-blue-600 mb-4">
                <Clock className="h-3 w-3" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Instant Payouts</h3>
              <p className="text-gray-600">
                No claim forms or waiting periods. Receive your payout directly to your wallet as soon as a delay is confirmed.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="text-blue-600 mb-4">
                <Shield className="h-3 w-3" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Transparent & Secure</h3>
              <p className="text-gray-600">
                All policies and claims are recorded on the blockchain, providing complete transparency and security.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="text-blue-600 mb-4">
                <DollarSign className="h-3 w-3" />
              </div>
              <h3 className="text-lg font-semibold mb-3">No Hidden Fees</h3>
              <p className="text-gray-600">
                Pay only for the coverage you need. No administration fees, no hidden charges. Everything is transparent.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="text-blue-600 mb-4">
                <Zap className="h-3 w-3" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Fast & Efficient</h3>
              <p className="text-gray-600">
                Purchase insurance in seconds and receive payouts automatically. No paperwork, no hassle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Get Started Section */}
      <section id="get-started" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-center mb-6">Get Started</h2>
            
            {!account ? (
              <div className="text-center">
                <p className="text-lg mb-6">
                  Connect your wallet to purchase flight delay insurance
                </p>
                <div className="flex justify-center">
                  <div className="inline-flex items-start p-4 bg-blue-50 text-blue-700 rounded-md">
                    <AlertTriangle className="h-3 w-3 mt-0.5 mr-2 flex-shrink-0" />
                    <p>Please use the Connect Wallet button in the navbar to get started.</p>
                  </div>
                </div>
              </div>
            ) : !network.isSupported ? (
              <div className="text-center bg-red-50 text-red-700 p-6 rounded-md">
                <p className="text-lg mb-2 font-semibold">
                  Please switch to a supported network
                </p>
                <p>
                  Currently on: <strong>{network.name}</strong>
                </p>
                <p className="mt-4">
                  Supported networks: Ethereum Mainnet, Sepolia Testnet, Polygon Mainnet, Mumbai Testnet
                </p>
              </div>
            ) : (
              <PurchasePolicy />
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">FAQ</h2>
          </div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden divide-y divide-gray-200">
            <details className="group p-6">
              <summary className="flex justify-between items-center cursor-pointer">
                <h3 className="text-lg font-semibold">How does the insurance payout work?</h3>
                <span className="transition-transform duration-200 group-open:rotate-180">
                  <svg className="h-3 w-3" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" stroke="currentColor" />
                  </svg>
                </span>
              </summary>
              <div className="mt-3 text-gray-600">
                <p>
                  If your flight is delayed by more than 2 hours, our smart contract automatically triggers a payout to your wallet. 
                  The payout amount is typically 3x your premium, capped at a maximum limit.
                </p>
              </div>
            </details>
            <details className="group p-6">
              <summary className="flex justify-between items-center cursor-pointer">
                <h3 className="text-lg font-semibold">What happens if my flight is cancelled?</h3>
                <span className="transition-transform duration-200 group-open:rotate-180">
                  <svg className="h-3 w-3" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" stroke="currentColor" />
                  </svg>
                </span>
              </summary>
              <div className="mt-3 text-gray-600">
                <p>
                  Flight cancellations are treated the same as delays and will trigger the payout if they're confirmed by our oracle data sources.
                </p>
              </div>
            </details>
            <details className="group p-6">
              <summary className="flex justify-between items-center cursor-pointer">
                <h3 className="text-lg font-semibold">How do you verify flight delays?</h3>
                <span className="transition-transform duration-200 group-open:rotate-180">
                  <svg className="h-3 w-3" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" stroke="currentColor" />
                  </svg>
                </span>
              </summary>
              <div className="mt-3 text-gray-600">
                <p>
                  We use Chainlink oracles that fetch data from reliable flight information providers. This ensures the data is accurate and tamper-proof.
                </p>
              </div>
            </details>
            <details className="group p-6">
              <summary className="flex justify-between items-center cursor-pointer">
                <h3 className="text-lg font-semibold">Can I cancel my policy?</h3>
                <span className="transition-transform duration-200 group-open:rotate-180">
                  <svg className="h-3 w-3" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" stroke="currentColor" />
                  </svg>
                </span>
              </summary>
              <div className="mt-3 text-gray-600">
                <p>
                  Yes, you can cancel your policy before the flight departure time and receive a 50% refund of your premium.
                </p>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">Trusted by travelers worldwide</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-8 items-center">
            <div className="flex items-center">
              <svg className="h-3 w-3 text-blue-600 mr-2" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke="currentColor" />
              </svg>
              <span className="text-lg font-medium text-gray-700">5,000+ Policies Issued</span>
            </div>
            <div className="w-px h-10 bg-gray-300 hidden sm:block"></div>
            <div className="flex items-center">
              <svg className="h-3 w-3 text-blue-600 mr-2" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" />
              </svg>
              <span className="text-lg font-medium text-gray-700">300+ Successful Claims</span>
            </div>
            <div className="w-px h-10 bg-gray-300 hidden sm:block"></div>
            <div className="flex items-center">
              <svg className="h-3 w-3 text-blue-600 mr-2" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" />
              </svg>
              <span className="text-lg font-medium text-gray-700">Avg. 5-min Payout Time</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;