import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { ethers } from "ethers";
import { Web3Provider as EthersWeb3Provider } from "@ethersproject/providers";
import BaggagePolicyABI from "../utils/abis/BaggagePolicy.json";
import FlightPolicyABI from "../utils/abis/FlightPolicy.json";
import InsurerABI from "../utils/abis/Insurer.json";
import OracleConnectorABI from "../utils/abis/OracleConnector.json";
import contractAddresses from "../utils/contractAddresses.json";

// Extend the Window interface to recognize `ethereum` injected by MetaMask
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Define roles
export enum Role {
  Insurer = "Insurer",
  User = "User",
}

interface Web3ContextType {
  provider: EthersWeb3Provider | null;
  signer: ethers.Signer | null;
  account: string | null;
  chainId: number | null;
  baggagePolicyContract: ethers.Contract | null;
  flightPolicyContract: ethers.Contract | null;
  insurerContract: ethers.Contract | null;
  oracleConnectorContract: ethers.Contract | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  network: { name: string; isSupported: boolean };
  role: Role | null;
}

// Create the context object
const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Hook to access the context easily in components
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) throw new Error("useWeb3 must be used within a Web3Provider");
  return context;
};

interface Web3ProviderProps {
  children: ReactNode;
}

// Supported networks
const SUPPORTED_NETWORKS: Record<string, string> = {
  "1": "Ethereum Mainnet",
  "11155111": "Sepolia Testnet",
  "137": "Polygon Mainnet",
  "80001": "Mumbai Testnet",
  "31337": "Local Hardhat",
};

const Web3Provider = ({ children }: Web3ProviderProps) => {
  const [provider, setProvider] = useState<EthersWeb3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [baggagePolicyContract, setBaggagePolicyContract] = useState<ethers.Contract | null>(null);
  const [flightPolicyContract, setFlightPolicyContract] = useState<ethers.Contract | null>(null);
  const [insurerContract, setInsurerContract] = useState<ethers.Contract | null>(null);
  const [oracleConnectorContract, setOracleConnectorContract] = useState<ethers.Contract | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  // Compute network name and support status
  const network = useMemo(
    () => ({
      name: chainId ? SUPPORTED_NETWORKS[chainId] || `Unknown (${chainId})` : "",
      isSupported: !!chainId && SUPPORTED_NETWORKS.hasOwnProperty(String(chainId)),
    }),
    [chainId]
  );

  const setProviderSignerChainId = async () => {
    const web3Provider = new ethers.BrowserProvider(window.ethereum);
    const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
    const networkChainId = parseInt(chainIdHex, 16);
    setProvider(web3Provider as unknown as EthersWeb3Provider);
    setSigner(await web3Provider.getSigner());
    setChainId(networkChainId);
  };

  // Connect wallet via MetaMask
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask or another Web3 provider");
      return;
    }

    localStorage.removeItem("wallet-disconnected");

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      setProviderSignerChainId();
    } catch (error) {
      console.error("Error connecting wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  /**
   * Auto-connect wallet on page refresh if already authorized.
   */
  useEffect(() => {
    const autoConnect = async () => {
      if (!window.ethereum) return;

      if (localStorage.getItem("wallet-disconnected") === "true") return;

      try {
        const accounts: string[] = await window.ethereum.request({ method: "eth_accounts" });

        // If there is a connected account, proceed to connect
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setProviderSignerChainId();
        }
      } catch (err) {
        console.error("🔁 Auto-connect failed:", err);
      }
    };

    autoConnect();
  }, []);

  // Disconnect wallet (clears state)
  const disconnectWallet = useCallback(() => {
    localStorage.setItem("wallet-disconnected", "true");

    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setBaggagePolicyContract(null);
    setFlightPolicyContract(null);
    setInsurerContract(null);
    setOracleConnectorContract(null);
    setRole(null);
  }, []);

  // Detect if account is insurer (based on isInsurer(account))
  const fetchUserRole = useCallback(async () => {
    if (!insurerContract || !account) {
      setRole(null);
      return;
    }

    try {
      const isInsurer = await insurerContract.isInsurer(account);
      setRole(isInsurer ? Role.Insurer : Role.User);
    } catch (err) {
      console.error("Error checking insurer role:", err);
      setRole(null);
    }
  }, [insurerContract, account]);

  // Initialize contracts when provider, signer, and chainId are ready
  useEffect(() => {
    if (provider && signer && chainId) {
      const addresses = contractAddresses[String(chainId) as keyof typeof contractAddresses] || {};

      if (addresses.BaggagePolicy) {
        const baggagePolicy = new ethers.Contract(addresses.BaggagePolicy, BaggagePolicyABI.abi, signer);
        setBaggagePolicyContract(baggagePolicy);
      }

      if (addresses.FlightPolicy) {
        const policy = new ethers.Contract(addresses.FlightPolicy, FlightPolicyABI.abi, signer);
        setFlightPolicyContract(policy);
      }

      if (addresses.Insurer) {
        const insurer = new ethers.Contract(addresses.Insurer, InsurerABI.abi, signer);
        setInsurerContract(insurer);
      }

      if (addresses.OracleConnector) {
        const oracleConnector = new ethers.Contract(addresses.OracleConnector, OracleConnectorABI.abi, signer);
        setOracleConnectorContract(oracleConnector);
      }
    } else {
      setBaggagePolicyContract(null);
      setFlightPolicyContract(null);
      setInsurerContract(null);
      setOracleConnectorContract(null);
    }
  }, [provider, signer, chainId]);

  // Fetch role after contracts/account are ready
  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  useEffect(() => {
    setProviderSignerChainId();
  }, [account]);

  // Handle account changes (MetaMask)
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
        fetchUserRole();
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [fetchUserRole, disconnectWallet]);

  return (
    <Web3Context.Provider value={{ provider, signer, account, chainId, baggagePolicyContract, flightPolicyContract, insurerContract, oracleConnectorContract, isConnecting, connectWallet, disconnectWallet, network, role }}>
      {children}
    </Web3Context.Provider>
  );
};

export default Web3Provider;
