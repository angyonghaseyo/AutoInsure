import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../components/Web3Provider';
import ViewPolicy from '../components/ViewPolicy';
import Loader from '../components/Loader';
import { Policy, formatPolicy } from '../utils/flightInsurance';

const PoliciesPage: React.FC = () => {
  const { account, flightInsuranceContract, network } = useWeb3();
  
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingPolicyId, setProcessingPolicyId] = useState<number | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  
  // Load user policies
  useEffect(() => {
    const loadPolicies = async () => {
      if (!account || !flightInsuranceContract) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Get policy IDs for the user
        const policyIds = await flightInsuranceContract.getPoliciesByUser(account);
        
        // Load policy details for each ID
        const policyPromises = policyIds.map(async (id: bigint) => {
          const policyData = await flightInsuranceContract.getPolicyDetails(id);
          return formatPolicy(policyData);
        });
        
        const policyData = await Promise.all(policyPromises);
        setPolicies(policyData);
      } catch (err: any) {
        console.error('Error loading policies:', err);
        setError(err.message || 'Failed to load policies');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPolicies();
  }, [account, flightInsuranceContract]);
  
  // Handle policy claim
  const handleClaim = async (policyId: number) => {
    if (!flightInsuranceContract) return;
    
    try {
      setProcessingPolicyId(policyId);
      setActionSuccess(null);
      
      const tx = await flightInsuranceContract.claimPolicy(policyId);
      await tx.wait();
      
      setActionSuccess(`Successfully claimed policy #${policyId}`);
      
      // Reload policies to update status
      const policyIds = await flightInsuranceContract.getPoliciesByUser(account);
      const policyPromises = policyIds.map(async (id: bigint) => {
        const policyData = await flightInsuranceContract.getPolicyDetails(id);
        return formatPolicy(policyData);
      });
      
      const policyData = await Promise.all(policyPromises);
      setPolicies(policyData);
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
      
      const tx = await flightInsuranceContract.cancelPolicy(policyId);
      await tx.wait();
      
      setActionSuccess(`Successfully cancelled policy #${policyId}`);
      
      // Reload policies to update status
      const policyIds = await flightInsuranceContract.getPoliciesByUser(account);
      const policyPromises = policyIds.map(async (id: bigint) => {
        const policyData = await flightInsuranceContract.getPolicyDetails(id);
        return formatPolicy(policyData);
      });
      
      const policyData = await Promise.all(policyPromises);
      setPolicies(policyData);
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
        <h1 className="text-3xl font-bold mb-4">My Policies</h1>
        <div className="bg-yellow-50 p-4 rounded-md">
          <p className="text-yellow-700">
            Please connect your wallet to view your policies.
          </p>
        </div>
      </div>
    );
  }
  
  if (!network.isSupported) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">My Policies</h1>
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">
            Please switch to a supported network to view your policies.
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Policies</h1>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Purchase New Policy
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {actionSuccess && (
        <div className="bg-green-50 p-4 rounded-md mb-6">
          <p className="text-green-700">{actionSuccess}</p>
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-12">
          <Loader size="lg" />
          <p className="mt-4 text-gray-500">Loading your policies...</p>
        </div>
      ) : policies.length > 0 ? (
        <div>
          {policies.map((policy) => (
            <ViewPolicy
              key={policy.policyId}
              policy={policy}
              onClaim={handleClaim}
              onCancel={handleCancel}
              isProcessing={processingPolicyId === policy.policyId}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium">No policies found</h3>
          <p className="mt-1 text-gray-500">
            You haven't purchased any insurance policies yet.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Purchase Your First Policy
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoliciesPage;