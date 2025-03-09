import React from 'react';
import Link from 'next/link';
import { Shield, Clock, DollarSign, Zap, ArrowRight, CheckCircle, Users, Info, Wallet, AlertTriangle } from 'lucide-react';
import { useWeb3 } from '../components/Web3Provider';
import PurchasePolicy from '../components/PurchasePolicy';

const HomePage: React.FC = () => {
  const { account, network } = useWeb3();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 py-20">
        <div className="absolute top-0 left-0 right-0 bottom-0 opacity-10 bg-pattern"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Decentralized Flight<br />Delay Insurance
              </h1>
              <p className="text-lg text-blue-100 mb-8 max-w-lg">
                Instant payouts, transparent claims, and no middlemen.
                Powered by blockchain technology.
              </p>
              {account ? (
                <Link
                  href="/policies"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 shadow-md transition"
                >
                  View My Policies
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <button
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 shadow-md transition"
                  onClick={() => {
                    document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              )}
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="w-full max-w-md bg-white bg-opacity-10 backdrop-filter backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20 shadow-lg">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Flight Delay Protection</h3>
                    <p className="text-blue-100">Secure your travel plans today</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center text-blue-100">
                    <CheckCircle className="h-4 w-4 mr-2 text-blue-300" />
                    <span>Coverage for 2+ hour delays</span>
                  </div>
                  <div className="flex items-center text-blue-100">
                    <CheckCircle className="h-4 w-4 mr-2 text-blue-300" />
                    <span>3x premium payout guarantee</span>
                  </div>
                  <div className="flex items-center text-blue-100">
                    <CheckCircle className="h-4 w-4 mr-2 text-blue-300" />
                    <span>Automatic smart contract execution</span>
                  </div>
                  <div className="flex items-center text-blue-100">
                    <CheckCircle className="h-4 w-4 mr-2 text-blue-300" />
                    <span>Trusted Chainlink oracle data feeds</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our decentralized flight insurance platform makes protecting your travels simple and transparent.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Purchase Insurance</h3>
              <p className="text-gray-600">
                Connect your wallet and purchase insurance for your flight by paying a small premium.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Flight Data Oracle</h3>
              <p className="text-gray-600">
                Our smart contracts use Chainlink oracles to monitor flight status from reliable data sources.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Automatic Payout</h3>
              <p className="text-gray-600">
                If your flight is delayed by more than 2 hours, you'll receive an automatic payout to your wallet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Benefits</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the advantages of blockchain-based flight insurance.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="text-blue-600 mb-4">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Instant Payouts</h3>
              <p className="text-gray-600">
                No claim forms or waiting periods. Receive your payout directly to your wallet as soon as a delay is confirmed.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="text-blue-600 mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Transparent & Secure</h3>
              <p className="text-gray-600">
                All policies and claims are recorded on the blockchain, providing complete transparency and security.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="text-blue-600 mb-4">
                <DollarSign className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-3">No Hidden Fees</h3>
              <p className="text-gray-600">
                Pay only for the coverage you need. No administration fees, no hidden charges. Everything is transparent.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="text-blue-600 mb-4">
                <Zap className="h-8 w-8" />
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
      <section id="get-started" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Started</h2>
              <p className="text-lg text-gray-600">
                Purchase flight delay insurance in just a few steps
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
              {!account ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-4">
                    <Wallet className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Connect Your Wallet</h3>
                  <p className="text-gray-600 mb-6">
                    Connect your wallet to purchase flight delay insurance
                  </p>
                  <div className="flex justify-center">
                    <div className="inline-flex items-center p-4 bg-blue-50 text-blue-700 rounded-md">
                      <Info className="h-5 w-5 mr-2 flex-shrink-0" />
                      <p>Please use the Connect Wallet button in the navbar to get started.</p>
                    </div>
                  </div>
                </div>
              ) : !network.isSupported ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Switch Network</h3>
                  <div className="bg-red-50 text-red-700 p-6 rounded-md">
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
                </div>
              ) : (
                <PurchasePolicy />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">Trusted by travelers worldwide</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-8 items-center">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-lg font-medium text-gray-700">5,000+ Policies Issued</span>
            </div>
            <div className="w-px h-10 bg-gray-300 hidden sm:block"></div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-lg font-medium text-gray-700">300+ Successful Claims</span>
            </div>
            <div className="w-px h-10 bg-gray-300 hidden sm:block"></div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-lg font-medium text-gray-700">Avg. 5-min Payout Time</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;