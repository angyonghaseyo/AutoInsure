import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../components/Web3Provider';
import { Policy, formatPolicy, PolicyStatus } from '../services/flightInsurance';
import { 
  AlertTriangle, CheckCircle, Loader, Clock, Calendar, 
  Search, FileSearch, ExternalLink, ArrowRight
} from 'lucide-react';
import { ethers } from 'ethers';

const ClaimStatusCard: React.FC<{
  flightData: any;
  isLoading: boolean;
  error: string | null;
  delayThreshold: number;
  onClaim: () => void;
  isProcessing: boolean;
  canClaim: boolean;
}> = ({ 
  flightData, 
  isLoading, 
  error, 
  delayThreshold, 
  onClaim, 
  isProcessing,
  canClaim
}) => {
  
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center space-x-3">
          <Loader className="h-8 w-8 text-blue-500 animate-spin" />
          <div>
            <h3 className="text-lg font-medium">Checking flight status...</h3>
            <p className="text-gray-500">This may take a few moments</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-lg shadow-md border border-red-200">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-medium text-red-800">Error checking flight status</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!flightData || !flightData.dataReceived) {
    return (
      <div className="bg-yellow-50 p-6 rounded-lg shadow-md border border-yellow-200">
        <div className="flex items-start space-x-3">
          <Clock className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800">Waiting for flight data</h3>
            <p className="text-yellow-700">
              Flight data is not yet available. Please check back later.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const isEligible = flightData.isDelayed && flightData.delayMinutes >= delayThreshold;
  
  return (
    <div className={`p-6 rounded-lg shadow-md border ${
      isEligible ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
    }`}>
      <div className="flex items-start space-x-4">
        <div className={`rounded-full p-3 ${
          isEligible ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
        }`}>
          {isEligible ? (
            <CheckCircle className="h-6 w-6" />
          ) : (
            <Clock className="h-6 w-6" />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-medium mb-1">
            {isEligible ? 'Eligible for claim' : 'Not eligible for claim'}
          </h3>
          
          <div className="space-y-2 mb-4">
            <p className={`${isEligible ? 'text-green-700' : 'text-yellow-700'}`}>
              <span className="font-medium">Flight Status:</span> {
                flightData.isDelayed 
                  ? `Delayed by ${flightData.delayMinutes} minutes` 
                  : 'On time'
              }
            </p>
            <p className={`${isEligible ? 'text-green-700' : 'text-yellow-700'}`}>
              <span className="font-medium">Required Delay:</span> {delayThreshold} minutes
            </p>
          </div>
          
          {isEligible && canClaim && (
            <button
              onClick={onClaim}
              disabled={isProcessing}
              className="w-full mt-2 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Processing Claim...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Claim Payout
                </>
              )}
            </button>
          )}
          
          {isEligible && !canClaim && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-blue-700 text-sm mt-2">
              <p className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />
                <span>
                  This policy has already been claimed or is no longer active.
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ClaimPage: React.FC = () => {
  const { account, flightInsuranceContract, network } = useWeb3();
  
  // Form state
  const [policyId, setPolicyId] = useState<string>('');
  
  // Data state
  const [policyData, setPolicyData] = useState<Policy | null>(null);
  const [flightData, setFlightData] = useState<any>(null);
  
  // UI state
  const [isLoadingPolicy, setIsLoadingPolicy] = useState(false);
  const [isLoadingFlightData, setIsLoadingFlightData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flightDataError, setFlightDataError] = useState<string | null>(null);
  const [isProcessingClaim, setIsProcessingClaim] = useState(false);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // User policies
  const [userPolicies, setUserPolicies] = useState<Policy[]>([]);
  const [isLoadingUserPolicies, setIsLoadingUserPolicies] = useState(false);
  
  // Load user's policies
  useEffect(() => {
    const loadUserPolicies = async () => {
      if (!account || !flightInsuranceContract) return;
      
      try {
        setIsLoadingUserPolicies(true);
        
        const policyIds = await flightInsuranceContract.getPoliciesByUser(account);
        
        if (policyIds.length === 0) {
          setUserPolicies([]);
          return;
        }
        
        const policyPromises = policyIds.map(async (id: bigint) => {
          const policyData = await flightInsuranceContract.getPolicyDetails(id);
          return formatPolicy(policyData);
        });
        
        const policies = await Promise.all(policyPromises);
        
        // Filter for active policies that aren't already claimed
        const activePolicies = policies.filter(p => 
          p.status === PolicyStatus.Active && !p.isPaid && !p.isClaimed
        );
        
        // Sort by policy ID (newest first)
        activePolicies.sort((a, b) => b.policyId - a.policyId);
        
        setUserPolicies(activePolicies);
      } catch (err) {
        console.error('Error loading user policies:', err);
      } finally {
        setIsLoadingUserPolicies(false);
      }
    };
    
    loadUserPolicies();
  }, [account, flightInsuranceContract]);
  
  const handlePolicySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPolicyId(e.target.value);
    // Reset states
    setPolicyData(null);
    setFlightData(null);
    setError(null);
    setFlightDataError(null);
    setSuccess(null);
    setClaimTxHash(null);
  };
  
  const handleCheckPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!flightInsuranceContract) {
      setError('Web3 not initialized');
      return;
    }
    
    if (!policyId) {
      setError('Please select or enter a policy ID');
      return;
    }
    
    try {
      // Reset states
      setPolicyData(null);
      setFlightData(null);
      setError(null);
      setFlightDataError(null);
      setSuccess(null);
      setClaimTxHash(null);
      
      setIsLoadingPolicy(true);
      
      // Load policy details
      const policy = await flightInsuranceContract.getPolicyDetails(policyId);
      const formattedPolicy = formatPolicy(policy);
      setPolicyData(formattedPolicy);
      
      // Get oracle connector address
      const oracleConnectorAddress = await flightInsuranceContract.oracleConnector();
      
      // Get flight data from oracle connector
      try {
        setIsLoadingFlightData(true);
        
        // Load the OracleConnector contract
        const OracleConnectorABI = await import('../utils/abis/OracleConnector.json');
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const signer = await provider.getSigner();
        
        const oracleConnector = new ethers.Contract(
          oracleConnectorAddress,
          OracleConnectorABI.abi,
          signer
        );
        
        // Get cached flight data
        const [isDelayed, delayMinutes, dataReceived] = await oracleConnector.getCachedFlightData(
          formattedPolicy.flightNumber,
          formattedPolicy.departureTime
        );
        
        setFlightData({
          isDelayed,
          delayMinutes: Number(delayMinutes),
          dataReceived
        });
        
        // If data not received yet, request it
        if (!dataReceived) {
          try {
            await oracleConnector.requestFlightData(
              formattedPolicy.flightNumber,
              formattedPolicy.departureTime
            );
          } catch (err) {
            console.warn('Error requesting flight data (may be expected):', err);
          }
        }
      } catch (err: any) {
        console.error('Error getting flight data:', err);
        setFlightDataError(err.message || 'Failed to get flight data');
      } finally {
        setIsLoadingFlightData(false);
      }
    } catch (err: any) {
      console.error('Error checking policy:', err);
      setError(err.message || 'Failed to check policy');
    } finally {
      setIsLoadingPolicy(false);
    }
  };
  
  const handleClaim = async () => {
    if (!flightInsuranceContract || !policyData) return;
    
    try {
      setIsProcessingClaim(true);
      setSuccess(null);
      setError(null);
      setClaimTxHash(null);
      
      const tx = await flightInsuranceContract.claimPolicy(policyData.policyId);
      setClaimTxHash(tx.hash);
      
      setSuccess('Transaction submitted. Waiting for confirmation...');
      
      await tx.wait();
      
      setSuccess(`Successfully claimed policy #${policyData.policyId} for ${policyData.payoutAmount} ETH!`);
      
      // Refresh policy data
      const updatedPolicy = await flightInsuranceContract.getPolicyDetails(policyData.policyId);
      setPolicyData(formatPolicy(updatedPolicy));
    } catch (err: any) {
      console.error('Error claiming policy:', err);
      setError(err.message || 'Failed to claim policy');
    } finally {
      setIsProcessingClaim(false);
    }
  };
  
  // Format the date nicely
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Check if policy can be claimed
  const canClaimPolicy = () => {
    if (!policyData) return false;
    
    return (
      policyData.status === PolicyStatus.Active &&
      !policyData.isPaid &&
      !policyData.isClaimed
    );
  };
  
  if (!account) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-6">Claim Policy</h1>
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-yellow-700 text-lg mb-4">
            Please connect your wallet to claim a policy
          </p>
          <p className="text-yellow-600">
            Use the Connect Wallet button in the navigation bar to continue
          </p>
        </div>
      </div>
    );
  }
  
  if (!network.isSupported) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-6">Claim Policy</h1>
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 text-lg mb-4">
            Please switch to a supported network to claim a policy
          </p>
          <p className="text-red-600 font-medium">
            Current network: {network.name}
          </p>
          <p className="text-red-600 mt-2">
            Supported networks: Ethereum Mainnet, Sepolia Testnet, Polygon Mainnet, Mumbai Testnet
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto px-4">
      <h1 className="text-3xl font-bold mb-8">Claim Insurance Policy</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold mb-4">Check Policy Status</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md mb-6 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <div>
              <p>{success}</p>
              {claimTxHash && (
                <a
                  href={`https://etherscan.io/tx/${claimTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center text-sm"
                >
                  View transaction on Etherscan
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              )}
            </div>
          </div>
        )}
        
        <form onSubmit={handleCheckPolicy} className="space-y-4">
          <div>
            <label htmlFor="policyId" className="block text-sm font-medium text-gray-700 mb-1">
              Select Policy
            </label>
            
            {isLoadingUserPolicies ? (
              <div className="flex items-center space-x-2 text-gray-500">
                <Loader className="h-4 w-4 animate-spin" />
                <span>Loading your policies...</span>
              </div>
            ) : userPolicies.length > 0 ? (
              <div className="relative">
                <select
                  id="policyId"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={policyId}
                  onChange={handlePolicySelect}
                  required
                >
                  <option value="">Select a policy</option>
                  {userPolicies.map((policy) => (
                    <option key={policy.policyId} value={policy.policyId}>
                      Policy #{policy.policyId} - Flight {policy.flightNumber}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="policyId"
                    className="block w-full pl-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter policy ID"
                    value={policyId}
                    onChange={(e) => setPolicyId(e.target.value)}
                    required
                  />
                </div>
                
                {userPolicies.length === 0 && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-blue-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3 flex-1 md:flex md:justify-between">
                        <p className="text-sm text-blue-700">
                          You don't have any active policies. Purchase a policy first.
                        </p>
                        <p className="mt-3 text-sm md:mt-0 md:ml-6">
                          <a
                            href="/"
                            className="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600 flex items-center"
                          >
                            Purchase now
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoadingPolicy || !policyId}
            >
              {isLoadingPolicy ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Checking Policy...
                </>
              ) : (
                <>
                  <FileSearch className="h-4 w-4 mr-2" />
                  Check Policy Status
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {policyData && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold mb-4">Policy Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 text-blue-600 p-3 rounded-full mr-3">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Flight Details</h3>
                  <p className="text-lg font-medium">{policyData.flightNumber}</p>
                  <p className="text-sm text-gray-500">{formatDate(policyData.departureTime)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-blue-100 text-blue-600 p-3 rounded-full mr-3">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Delay Threshold</h3>
                  <p className="text-lg font-medium">{policyData.delayThreshold} minutes</p>
                  <p className="text-sm text-gray-500">Minimum delay for payout</p>
                </div>
              </div>
            </div>
            
            <div className="border-l pl-6">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500">Policy ID</h3>
                <p className="text-lg font-medium">#{policyData.policyId}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    policyData.status === PolicyStatus.Active 
                      ? 'bg-green-100 text-green-800' 
                      : policyData.status === PolicyStatus.Claimed 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {policyData.status === PolicyStatus.Active 
                      ? 'Active' 
                      : policyData.status === PolicyStatus.Claimed 
                        ? 'Claimed' 
                        : policyData.status === PolicyStatus.Cancelled 
                          ? 'Cancelled' 
                          : 'Expired'}
                  </span>
                  {policyData.isPaid && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Paid out
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Payout Amount</h3>
                <p className="text-xl font-bold text-blue-600">{policyData.payoutAmount} ETH</p>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Flight Status & Claim Eligibility</h3>
            
            <ClaimStatusCard
              flightData={flightData}
              isLoading={isLoadingFlightData}
              error={flightDataError}
              delayThreshold={policyData.delayThreshold}
              onClaim={handleClaim}
              isProcessing={isProcessingClaim}
              canClaim={canClaimPolicy()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimPage;