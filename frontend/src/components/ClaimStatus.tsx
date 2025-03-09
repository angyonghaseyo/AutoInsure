import React from 'react';
import { FlightData, formatDelayStatus } from '../utils/chainlink';

interface ClaimStatusProps {
  flightData: FlightData | null;
  isLoading: boolean;
  claimStatus: 'idle' | 'loading' | 'success' | 'error';
  claimError: string | null;
  claimTxHash: string | null;
  delayThreshold: number;
}

const ClaimStatus: React.FC<ClaimStatusProps> = ({
  flightData,
  isLoading,
  claimStatus,
  claimError,
  claimTxHash,
  delayThreshold,
}) => {
  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-100 p-4 rounded-md">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  if (!flightData) {
    return (
      <div className="bg-gray-100 p-4 rounded-md">
        <p className="text-gray-600">No flight data available</p>
      </div>
    );
  }

  const isEligibleForClaim = flightData.isDelayed && flightData.delayMinutes >= delayThreshold;

  return (
    <div className={`p-4 rounded-md ${isEligibleForClaim ? 'bg-green-50' : 'bg-yellow-50'}`}>
      <div className="flex items-center">
        <div className={`rounded-full p-2 mr-3 ${isEligibleForClaim ? 'bg-green-100 text-green-500' : 'bg-yellow-100 text-yellow-500'}`}>
          {isEligibleForClaim ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium">
            {isEligibleForClaim ? 'Eligible for claim' : 'Not eligible for claim'}
          </h3>
          <p className="text-sm text-gray-600">
            Flight Status: {formatDelayStatus(flightData.isDelayed, flightData.delayMinutes)}
          </p>
          <p className="text-sm text-gray-600">
            Required delay: {delayThreshold} minutes
          </p>
        </div>
      </div>

      {claimStatus === 'loading' && (
        <div className="mt-3 bg-blue-50 p-3 rounded-md">
          <p className="text-sm text-blue-700">Processing claim. Please wait...</p>
        </div>
      )}

      {claimStatus === 'success' && (
        <div className="mt-3 bg-green-50 p-3 rounded-md">
          <p className="text-sm text-green-700">Claim processed successfully!</p>
          {claimTxHash && (
            <p className="text-xs text-green-600 mt-1">
              Transaction: {claimTxHash.substring(0, 10)}...{claimTxHash.substring(claimTxHash.length - 10)}
            </p>
          )}
        </div>
      )}

      {claimStatus === 'error' && (
        <div className="mt-3 bg-red-50 p-3 rounded-md">
          <p className="text-sm text-red-700">
            Error processing claim: {claimError || 'Unknown error'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClaimStatus;