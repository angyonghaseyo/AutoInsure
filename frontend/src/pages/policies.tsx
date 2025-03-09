import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWeb3 } from '../components/Web3Provider';
import { Policy, formatPolicy, PolicyStatus } from '../services/flightInsurance';
import { Plus, AlertTriangle, CheckCircle, Loader, RefreshCw } from 'lucide-react';

const PolicyCard: React.FC<{
  policy: Policy;
  onClaim: (id: number) => void;
  onCancel: (id: number) => void;
  isProcessing: boolean;
}> = ({ policy, onClaim, onCancel, isProcessing }) => {
  // Format departure time
  const formatDepartureTime = (timestamp: number) => {
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

  // Get policy status color
  const getStatusColor = (status: PolicyStatus) => {
    switch (status) {
      case PolicyStatus.Active:
        return "bg-green-100 text-green-800 border-green-200";
      case PolicyStatus.Expired:
        return "bg-gray-100 text-gray-800 border-gray-200";
      case PolicyStatus.Claimed:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case PolicyStatus.Cancelled:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get policy status text
  const getStatusText = (status: PolicyStatus) => {
    switch (status) {
      case PolicyStatus.Active:
        return "Active";
      case PolicyStatus.Expired:
        return "Expired";
      case PolicyStatus.Claimed:
        return "Claimed";
      case PolicyStatus.Cancelled:
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  // Check if policy can be claimed
  const canClaim = () => {
    if (policy.status !== PolicyStatus.Active || policy.isPaid || policy.isClaimed) {
      return false;
    }
    
    const now = Math.floor(Date.now() / 1000);
    return now > policy.departureTime;
  };
  
  // Check if policy can be cancelled
  const canCancel = () => {
    if (policy.status !== PolicyStatus.Active || policy.isPaid || policy.isClaimed) {
      return false;
    }
    
    const now = Math.floor(Date.now() / 1000);
    return now < policy.departureTime;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4 border border-gray-200">
      <div className="p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-bold">Flight {policy.flightNumber}</h3>
          <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full border ${getStatusColor(policy.status)}`}>
            {getStatusText(policy.status)}
          </span>
        </div>
        
        <div className="mb-4">
          <div className="text-sm text-gray-500">Departure Time</div>
          <div className="font-medium">{formatDepartureTime(policy.departureTime)}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-500">Premium</div>
            <div className="font-medium">{policy.premium} ETH</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Payout</div>
            <div className="font-medium">{policy.payoutAmount} ETH</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Policy ID</div>
            <div className="font-medium">#{policy.policyId}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Delay Threshold</div>
            <div className="font-medium">{policy.delayThreshold} minutes</div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          {canClaim() && (
            <button
              onClick={() => onClaim(policy.policyId)}
              disabled={isProcessing}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isProcessing ? <Loader className="animate-spin h-4 w-4 mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Claim Payout
            </button>
          )}
          
          {canCancel() && (
            <button
              onClick={() => onCancel(policy.policyId)}
              disabled={isProcessing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel Policy
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const PoliciesPage: React.FC = () => {
  const { account, flightInsuranceContract, network } = useWeb3();
  
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingPolicyId, setProcessingPolicyId] = useState<number | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  
  const loadPolicies = async () => {
    if (!account || !flightInsuranceContract) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get policy IDs for the user
      const policyIds = await flightInsuranceContract.getPoliciesByUser(account);
      
      if (policyIds.length === 0) {
        setPolicies([]);
        return;
      }
      
      // Load policy details for each ID
      const policyPromises = policyIds.map(async (id: bigint) => {
        const policyData = await flightInsuranceContract.getPolicyDetails(id);
        return formatPolicy(policyData);
      });
      
      const policyData = await Promise.all(policyPromises);
      
      // Sort policies by ID (newest first)
      policyData.sort((a, b) => b.policyId - a.policyId);
      
      setPolicies(policyData);
    } catch (err: any) {
      console.error('Error loading policies:', err);
      setError(err.message || 'Failed to load policies');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load policies on component mount
  useEffect(() => {
    loadPolicies();
  }, [account, flightInsuranceContract]);
  
  // Handle policy claim
  const handleClaim = async (policyId: number) => {
    if (!flightInsuranceContract) return;
    
    try {
      setProcessingPolicyId(policyId);
      setActionSuccess(null);
      setError(null);
      
      const tx = await flightInsuranceContract.claimPolicy(policyId);
      
      setActionSuccess(`Processing claim for policy #${policyId}...`);
      
      await tx.wait();
      
      setActionSuccess(`Successfully claimed policy #${policyId}`);
      
      // Reload policies to update status
      await loadPolicies();
    } catch (err: any) {
      console.error('Error claiming policy:', err);
      setError(err.message || 'Failed to claim policy');
    } finally {
      setProcessingPolicyId(null);
    }
  };
  
  // Handle policy cancellation
  const handleCancel = async (policyId: number) => {
    if (!flightInsuranceContract) return;
    
    try {
      setProcessingPolicyId(policyId);
      setActionSuccess(null);
      setError(null);
      
      const tx = await flightInsuranceContract.cancelPolicy(policyId);
      
      setActionSuccess(`Processing cancellation for policy #${policyId}...`);
      
      await tx.wait();
      
      setActionSuccess(`Successfully cancelled policy #${policyId}`);
      
      // Reload policies to update status
      await loadPolicies();
    } catch (err: any) {
      console.error('Error cancelling policy:', err);
      setError(err.message || 'Failed to cancel policy');
    } finally {
      setProcessingPolicyId(null);
    }
  };
  
  if (!account) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-6">My Policies</h1>
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-yellow-700 text-lg mb-4">
            Please connect your wallet to view your policies
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
        <h1 className="text-3xl font-bold mb-6">My Policies</h1>
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 text-lg mb-4">
            Please switch to a supported network to view your policies
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Policies</h1>
        <div className="flex space-x-3">
          <button 
            onClick={loadPolicies} 
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Policy
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      {actionSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md mb-6 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <p>{actionSuccess}</p>
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-16">
          <Loader className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500 text-lg">Loading your policies...</p>
        </div>
      ) : policies.length > 0 ? (
        <div className="space-y-6">
          {policies.map((policy) => (
            <PolicyCard
              key={policy.policyId}
              policy={policy}
              onClaim={handleClaim}
              onCancel={handleCancel}
              isProcessing={processingPolicyId === policy.policyId}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 p-8 rounded-lg shadow-sm text-center">
          <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No policies found</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            You haven't purchased any insurance policies yet. Get started by purchasing your first policy.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Purchase Your First Policy
          </Link>
        </div>
      )}
    </div>
  );
};

export default PoliciesPage;