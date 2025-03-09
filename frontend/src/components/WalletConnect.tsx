import React from 'react';
import { useWeb3 } from './Web3Provider';
import Loader from './Loader';

const WalletConnect: React.FC = () => {
  const { account, chainId, isConnecting, connectWallet, disconnectWallet, network } = useWeb3();

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getWalletButtonStyle = () => {
    if (!account) {
      return 'bg-blue-600 hover:bg-blue-700';
    }
    
    if (!network.isSupported) {
      return 'bg-red-600 hover:bg-red-700';
    }
    
    return 'bg-green-600 hover:bg-green-700';
  };

  return (
    <div className="flex items-center gap-2">
      {network.name && account && (
        <div className={`text-sm px-2 py-1 rounded ${network.isSupported ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {network.name}
        </div>
      )}
      
      <button
        onClick={account ? disconnectWallet : connectWallet}
        className={`${getWalletButtonStyle()} text-white font-medium py-2 px-4 rounded-md transition-colors duration-300 flex items-center gap-2`}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <Loader size="sm" /> Connecting...
          </>
        ) : account ? (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"
                clipRule="evenodd"
              />
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3.586l2.707 2.707a1 1 0 11-1.414 1.414l-3-3A1 1 0 019 10V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            {shortenAddress(account)}
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M17 9a1 1 0 01-1 1h-2v2a1 1 0 11-2 0v-2h-2a1 1 0 110-2h2V6a1 1 0 112 0v2h2a1 1 0 011 1z"
                clipRule="evenodd"
              />
              <path
                fillRule="evenodd"
                d="M2 9.5A3.5 3.5 0 005.5 13H9v2.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 15.586V13h2.5a4.5 4.5 0 10-9 0V4a1 1 0 10-2 0v5.5z"
                clipRule="evenodd"
              />
            </svg>
            Connect Wallet
          </>
        )}
      </button>
      
      {account && !network.isSupported && (
        <div className="text-red-600 text-sm mt-1">
          Please switch to a supported network
        </div>
      )}
    </div>
  );
};

export default WalletConnect;