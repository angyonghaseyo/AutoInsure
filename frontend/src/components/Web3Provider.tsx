import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers } from "ethers";
import { Web3Provider as EthersWeb3Provider } from "@ethersproject/providers";

// Contract ABIs and addresses
import insurerABI from "../utils/abis/Insurer.json";
import contractAddresses from "../utils/contractAddresses.json";

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

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  account: null,
  chainId: null,
  insurerContract: null,
  isConnecting: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  network: {
    name: "",
    isSupported: false,
  },
});

export const useWeb3 = () => useContext(Web3Context);

interface Web3ProviderProps {
  children: ReactNode;
}

// Supported networks
const SUPPORTED_NETWORKS = {
  1: "Ethereum Mainnet",
  11155111: "Sepolia Testnet",
  137: "Polygon Mainnet",
  80001: "Mumbai Testnet",
  31337: "Local Hardhat",
};

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [provider, setProvider] = useState<EthersWeb3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [insurerContract, setinsurerContract] = useState<ethers.Contract | null>(null);
  const [network, setNetwork] = useState({ name: "", isSupported: false });

  // Initialize contracts when provider and signer are available
  useEffect(() => {
    if (provider && signer && chainId) {
      try {
        // Get contract addresses for the current network
        const addresses = contractAddresses[chainId as keyof typeof contractAddresses] || {};

        if (addresses.insurer) {
          const insurer = new ethers.Contract(addresses.insurer, insurerABI.abi, signer);
          setinsurerContract(insurer);
        } else {
          console.warn(`insurer contract address not found for chainId ${chainId}`);
          setinsurerContract(null);
        }
      } catch (error) {
        console.error("Error initializing contracts:", error);
        setinsurerContract(null);
      }
    } else {
      setinsurerContract(null);
    }
  }, [provider, signer, chainId]);

  // Handle network change
  useEffect(() => {
    if (chainId) {
      const networkName = (SUPPORTED_NETWORKS as any)[chainId] || `Unknown (${chainId})`;
      const isSupported = Object.keys(SUPPORTED_NETWORKS).includes(chainId.toString());
      setNetwork({ name: networkName, isSupported });
    } else {
      setNetwork({ name: "", isSupported: false });
    }
  }, [chainId]);

  // Setup event listeners
  useEffect(() => {
    if (window.ethereum) {
      // Handle account change
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          disconnectWallet();
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
          if (provider) {
            setSigner(provider.getSigner());
          }
        }
      };

      // Handle chain change
      const handleChainChanged = (chainIdHex: string) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      // Cleanup event listeners
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [account, provider]);

  // Connect wallet function
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask or another web3 provider");
      return;
    }

    try {
      setIsConnecting(true);

      // Request accounts from wallet
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

      // Create ethers provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
      const networkChainId = parseInt(chainIdHex, 16);

      setProvider(web3Provider as unknown as EthersWeb3Provider);
      setSigner(await web3Provider.getSigner());
      setAccount(accounts[0]);
      setChainId(networkChainId);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setinsurerContract(null);
  };

  // Auto-connect if previously connected (optional)
  useEffect(() => {
    const autoConnect = async () => {
      if (window.ethereum) {
        try {
          // Check if already connected
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (error) {
          console.error("Error auto-connecting:", error);
        }
      }
    };

    autoConnect();
  }, []);

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        account,
        chainId,
        insurerContract,
        isConnecting,
        connectWallet,
        disconnectWallet,
        network,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export default Web3Provider;
