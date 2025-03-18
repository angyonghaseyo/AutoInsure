import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { ethers } from "ethers";
import { Web3Provider as EthersWeb3Provider } from "@ethersproject/providers";
import InsurerABI from "../utils/abis/Insurer.json";
import contractAddresses from "../utils/contractAddresses.json";

// Extend the Window interface to recognize `ethereum`
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Web3ContextType {
  provider: EthersWeb3Provider | null;
  signer: ethers.Signer | null;
  account: string | null;
  chainId: number | null;
  insurerContract: ethers.Contract | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  network: {
    name: string;
    isSupported: boolean;
  };
}

// Create Web3 context
const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Custom hook to use Web3 context
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};

interface Web3ProviderProps {
  children: ReactNode;
}

// Supported Ethereum Networks
const SUPPORTED_NETWORKS: Record<string, string> = {
  "1": 'Ethereum Mainnet',
  "11155111": 'Sepolia Testnet',
  "137": 'Polygon Mainnet',
  "80001": 'Mumbai Testnet',
  "31337": 'Local Hardhat',
};

const Web3Provider = ({ children }: Web3ProviderProps) => {
  const [provider, setProvider] = useState<EthersWeb3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [insurerContract, setInsurerContract] = useState<ethers.Contract | null>(null);

  /**
   * Compute network name and support status based on chainId.
   */
  const network = useMemo(() => ({
    name: chainId ? SUPPORTED_NETWORKS[chainId] || `Unknown (${chainId})` : '',
    isSupported: !!chainId && SUPPORTED_NETWORKS.hasOwnProperty(chainId),
  }), [chainId]);

  /**
   * Function to connect the wallet and initialize provider, signer, and chainId.
   */
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask or another Web3 provider');
      return;
    }

    setIsConnecting(true);
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const networkChainId = parseInt(chainIdHex, 16);

      setProvider(web3Provider as unknown as EthersWeb3Provider);
      setSigner(await web3Provider.getSigner());
      setAccount(accounts[0]);
      setChainId(networkChainId);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  /**
   * Function to disconnect the wallet and reset all states.
   */
  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setInsurerContract(null);
  }, []);

  /**
   * Load smart contract when provider, signer, and chainId are available.
   */
  useEffect(() => {
    if (provider && signer && chainId) {
      try {
        const addresses = contractAddresses[String(chainId) as keyof typeof contractAddresses] || {};
        if (addresses.Insurer) {
          setInsurerContract(new ethers.Contract(
            addresses.Insurer,
            InsurerABI.abi,
            signer
          ));
        } else {
          console.warn(`Insurer contract address not found for chainId ${chainId}`);
          setInsurerContract(null);
        }
      } catch (error) {
        console.error('Error initializing contract:', error);
        setInsurerContract(null);
      }
    } else {
      setInsurerContract(null);
    }
  }, [provider, signer, chainId]);

  /**
   * Handle wallet and network changes dynamically.
   */
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) disconnectWallet();
      else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        signer && setSigner(signer);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      setChainId(parseInt(chainIdHex, 16));
      window.location.reload(); // Reload to reinitialize contract instances
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [account, signer, disconnectWallet]);

  /**
   * Auto-connect wallet if previously connected.
   */
  useEffect(() => {
    (async () => {
      if (!window.ethereum) return;
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) await connectWallet();
      } catch (error) {
        console.error('Auto-connect error:', error);
      }
    })();
  }, [connectWallet]);

  return (
    <Web3Context.Provider value={{ provider, signer, account, chainId, insurerContract, isConnecting, connectWallet, disconnectWallet, network }}>
      {children}
    </Web3Context.Provider>
  );
};

export default Web3Provider;