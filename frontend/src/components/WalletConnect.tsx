// components/WalletConnect.tsx
import React, { useState } from 'react';
import { Wallet, AlertTriangle, ChevronDown, LogOut, ExternalLink } from 'lucide-react';
import { useWeb3 } from './Web3Provider';

const WalletConnect: React.FC = () => {
  const { account, chainId, isConnecting, connectWallet, disconnectWallet, network } = useWeb3();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleClickOutside = () => {
    setIsDropdownOpen(false);
  };

  // Handle connection status
  const getNetworkColor = () => {
    if (!network.isSupported) return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  return (
    <div className="relative">
      {network.name && account && (
        <div className={`text-xs px-2 py-1 rounded-full mr-2 ${getNetworkColor()}`}>
          {network.name}
        </div>
      )}
      
      {!account ? (
        <button
          onClick={connectWallet}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300 flex items-center gap-2 shadow-sm"
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Wallet className="h-3 w-3" /> 
              <span>Connect Wallet</span>
            </>
          )}
        </button>
      ) : (
        <div className="relative">
          <button
            onClick={toggleDropdown}
            className={`
              flex items-center space-x-2 font-medium py-2 px-4 rounded-md shadow-sm transition-colors
              ${network.isSupported ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
            `}
          >
            <Wallet className="h-3 w-3" />
            <span>{shortenAddress(account)}</span>
            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={handleClickOutside}
              ></div>
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                <div className="py-1">
                  <div className="block px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                    <div className="font-medium text-gray-900">Connected</div>
                    <div className="text-xs text-gray-500 mt-1 break-all">{account}</div>
                  </div>
                  <a
                    href={`https://etherscan.io/address/${account}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <ExternalLink className="h-3 w-3 mr-2 text-gray-500" />
                    View on Etherscan
                  </a>
                  <button
                    onClick={disconnectWallet}
                    className="flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-3 w-3 mr-2" />
                    Disconnect Wallet
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      
      {account && !network.isSupported && (
        <div className="absolute top-full right-0 mt-2 w-64 text-red-600 text-sm bg-white p-3 rounded-md shadow-md border border-red-200 z-50 flex items-center gap-2">
          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
          <span>Please switch to a supported network</span>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;