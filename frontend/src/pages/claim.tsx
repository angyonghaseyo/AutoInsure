import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../components/Web3Provider';
import Loader from '../components/Loader';
import ClaimStatus from '../components/ClaimStatus';
import { formatPolicy, PolicyStatus } from '../utils/flightInsurance';
import { getCachedFlightData, FlightData } from '../utils/chainlink';

const ClaimPage: React.FC = () => {
  const { account, flightInsuranceContract, network } = useWeb3();
  
  // Form state
  const [policyId, setPolicyId] = useState<string>('');
  
  // Data state
  const [policyData, setPolicyData] = useState<any>(null);
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  
  // UI state
  const [isLoadingPolicy, setIsLoadingPolicy] = useState(false);
  const [isLoadingFlightData, setIsLoadingFlightData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimStatus, setClaimStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);
  
  // Load user's policies for dropdown
  const [userPolicies, setUserPolicies] = useState<any[]>([]);
  const [isLoadingUserPolicies, setIsLoadingUserPolicies] = useState(false);
  
  useEffect(() => {
    const loadUserPolicies = async () => {
      if (!account || !flightInsuranceContract) return;
      
      try {
        setIsLoadingUserPolicies(true);
        
        // Get policy IDs for the user
        const policyIds = await flightInsuranceContract.getPoliciesByUser(account);
        
        // Load policy details for each ID
        const policyPromises = policyIds.map(async (id: bigint) => {
          const policyData = await flightInsuranceContract.getPolicyDetails(id);
          return formatPolicy(policyData);
        });
        
        const policies = await Promise.all(policyPromises);
        
        // Filter for active policies
        const activePolicies = policies.filter(p => 
          p.status === PolicyStatus.Active && !p.isPaid && !p.isClaimed
        );
        
        setUserPolicies(activePolicies);
      } catch (err: any) {
        console.error('Error loading user policies:', err);
      } finally {
        setIsLoadingUserPolicies(false);
      }
    };
    
    loadUserPolicies();
  }, [account, flightInsuranceContract]);
  
  const handlePolicyIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPolicyId(e.target.value);
    // Reset states
    setPolicyData(null);
    setFlightData(null);
    setError(null);
    setClaimStatus('idle');
    setClaimError(null);
    setClaimTxHash(null);
  };
  
  const handleCheckPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!flightInsuranceContract) {
      setError('Web3 not initialized');
      return;
    }
    
    if (!policyId) {
      setError('Please enter a policy ID');
      return;
    }
    
    try {
      setIsLoadingPolicy(true);
      setError(null);
      
      // Load policy details
      const policy = await flightInsuranceContract.getPolicyDetails(policyId);
      setPolicyData(formatPolicy(policy));
      
      // Get oracle connector contract address
      const oracleConnectorAddress = await flightInsuranceContract.oracleConnector();
      
      // Get Oracle contract
      const { ethers } = await import('ethers');
      const OracleConnectorABI = await import('../utils/abis/OracleConnector.json');
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      
      const oracleConnector = new ethers.Contract(
        oracleConnectorAddress,
        OracleConnectorABI.abi,
        signer
      );
      
      // Load flight data
      setIsLoadingFlightData(true);
      const flightDataResponse = await getCachedFlightData(
        oracleConnector,
        policy.flightNumber,
        parseInt(policy.departureTime.toString())
      );
      
      setFlightData(flightDataResponse);
    } catch (err: any) {
      console.error('Error checking policy:', err);
      setError(err.message || 'Failed to check policy');
    } finally {
      setIsLoadingPolicy(false);
      setIsLoadingFlightData(false);
    }
  };
  
  const handleClaim = async () => {
    if (!flightInsuranceContract || !policyData) return;
    
    try {
      setClaimStatus('loading');
      setClaimError(null);
      setClaimTxHash(null);
      
      const tx = await flightInsuranceContract.claimPolicy(policyData.policyId);
      setClaimTxHash(tx.hash);
      
      await tx.wait();
      
      setClaimStatus('success');
      
      // Refresh policy data
      const updatedPolicy = await flightInsuranceContract.getPolicyDetails(policyData.policyId);
      setPolicyData(formatPolicy(updatedPolicy));
    } catch (err: any) {
      console.error('Error claiming policy:', err);
      setClaimStatus('error');
      setClaimError(err.message || 'Failed to claim policy');
    }
  };
  
  if (!account) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Claim Policy</h1>
        <div className="bg-yellow-50 p-4 rounded-md">
          <p className="text-yellow-700">
            Please connect your wallet to claim a policy.
          </p>
        </div>
      </div>
    );
  }
  
  if (!network.isSupported) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Claim Policy</h1>
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">
            Please switch to a supported network to claim a policy.
          </p>
          <p className="text-red-700 mt-2">
            Current network: {network.name}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Claim Flight Insurance Policy</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Check Policy Status</h2>
        
        {error && (
          <div className="bg-red-50 p-4 rounded-md mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleCheckPolicy}>
          <div className="mb-4">
            <label htmlFor="policyId" className="block text-gray-700 font-medium mb-2">
              Policy ID
            </label>
            
            {isLoadingUserPolicies ? (
              <div className="flex items-center space-x-2">
                <Loader size="sm" />
                <span className="text-gray-500">Loading your policies...</span>
              </div>
            ) : userPolicies.length > 0 ? (
              <select
                id="policyId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={policyId}
                onChange={handlePolicyIdChange}
                required
              >
                <option value="">Select a policy</option>
                {userPolicies.map((policy) => (
                  <option key={policy.policyId} value={policy.policyId}>
                    Policy #{policy.policyId} - Flight {policy.flightNumber}
                  </option>
                ))}
              </select>
            ) : (
              <div>
                <input
                  type="text"
                  id="policyId"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your policy ID"
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                  required
                />
                {userPolicies.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    You don't have any active policies
                  </p>
                )}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isLoadingPolicy || !policyId}
          >
            {isLoadingPolicy ? <Loader size="sm" /> : 'Check Policy Status'}
          </button>
        </form>
      </div>
      
      {policyData && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Policy Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Flight Number</p>
              <p className="font-medium">{policyData.flightNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Departure Time</p>
              <p className="font-medium">
                {new Date(policyData.departureTime * 1000).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Policy Status</p>
              <p className="font-medium">
                {policyData.status === PolicyStatus.Active ? 'Active' : 
                 policyData.status === PolicyStatus.Expired ? 'Expired' :
                 policyData.status === PolicyStatus.Claimed ? 'Claimed' : 'Cancelled'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payout Amount</p>
              <p className="font-medium">{policyData.payoutAmount} ETH</p>
            </div>
          </div>
          
          <h3 className="text-lg font-medium mb-2">Flight Status</h3>
          
          <ClaimStatus
            flightData={flightData}
            isLoading={isLoadingFlightData}
            claimStatus={claimStatus}
            claimError={claimError}
            claimTxHash={claimTxHash}
            delayThreshold={policyData.delayThreshold}
          />
          
          {flightData && flightData.isDelayed && flightData.delayMinutes >= policyData.delayThreshold && (
            <div className="mt-6">
              <button
                onClick={handleClaim}
                disabled={claimStatus === 'loading' || policyData.status !== PolicyStatus.Active}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {claimStatus === 'loading' ? <Loader size="sm" /> : 'Claim Payout'}
              </button>
              
              {policyData.status !== PolicyStatus.Active && (
                <p className="text-sm text-red-600 mt-2">
                  This policy cannot be claimed (status: {policyData.status === PolicyStatus.Active ? 'Active' : 
                   policyData.status === PolicyStatus.Expired ? 'Expired' :
                   policyData.status === PolicyStatus.Claimed ? 'Claimed' : 'Cancelled'})
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClaimPage;