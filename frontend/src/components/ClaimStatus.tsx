import React from 'react';
import { FlightData, formatDelayStatus } from '../services/chainlink';
import { CheckCircle, Clock, AlertTriangle, XCircle, Loader } from 'lucide-react';

interface ClaimStatusProps {
  flightData: FlightData | null;
  isLoading: boolean;
  claimStatus: 'idle' | 'loading' | 'success' | 'error';
  claimError: string | null;
  claimTxHash: string | null;
  delayThreshold: number;
  onClaim?: () => void;
  canClaim?: boolean;
}

const ClaimStatus: React.FC<ClaimStatusProps> = ({
  flightData,
  isLoading,
  claimStatus,
  claimError,
  claimTxHash,
  delayThreshold,
  onClaim,
  canClaim = true,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="mr-4 flex-shrink-0">
            <Loader className="h-4 w-4 text-blue-500 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Checking flight status...</h3>
            <p className="mt-1 text-sm text-gray-500">
              We're retrieving the latest flight information from our oracle network.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!flightData) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="mr-4 flex-shrink-0 bg-gray-200 rounded-full p-2">
            <Clock className="h-3 w-3 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-700">No flight data available</h3>
            <p className="mt-1 text-sm text-gray-500">
              Flight data hasn't been reported yet. Please check back closer to your flight departure time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isEligibleForClaim = flightData.isDelayed && flightData.delayMinutes >= delayThreshold;

  return (
    <div className={`rounded-lg shadow-sm border p-6 ${isEligibleForClaim ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
      <div className="flex items-start">
        <div className="mr-4 flex-shrink-0">
          {isEligibleForClaim ? (
            <div className="bg-green-100 rounded-full p-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
            </div>
          ) : (
            <div className="bg-yellow-100 rounded-full p-2">
              <Clock className="h-3 w-3 text-yellow-600" />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-medium">
            {isEligibleForClaim ? 'Eligible for claim' : 'Not eligible for claim'}
          </h3>
          
          <div className="mt-2 space-y-1">
            <p className={isEligibleForClaim ? 'text-green-700' : 'text-yellow-700'}>
              <span className="font-medium">Flight Status:</span> {formatDelayStatus(flightData.isDelayed, flightData.delayMinutes)}
            </p>
            <p className={isEligibleForClaim ? 'text-green-700' : 'text-yellow-700'}>
              <span className="font-medium">Required delay:</span> {delayThreshold} minutes
            </p>
          </div>

          {claimStatus === 'loading' && (
            <div className="mt-4 bg-white bg-opacity-60 p-3 rounded-md border border-blue-100">
              <div className="flex items-center">
                <Loader className="animate-spin h-3 w-3 text-blue-600 mr-2" />
                <p className="text-sm text-blue-700">Processing claim. Please wait...</p>
              </div>
            </div>
          )}

          {claimStatus === 'success' && (
            <div className="mt-4 bg-green-100 p-3 rounded-md">
              <div className="flex items-start">
                <CheckCircle className="h-3 w-3 text-green-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-green-700">Claim processed successfully!</p>
                  {claimTxHash && (
                    <a 
                      href={`https://etherscan.io/tx/${claimTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 mt-1 hover:underline inline-flex items-center"
                    >
                      View transaction 
                      <svg className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {claimStatus === 'error' && (
            <div className="mt-4 bg-red-50 p-3 rounded-md border border-red-200">
              <div className="flex items-start">
                <XCircle className="h-3 w-3 text-red-600 mr-2 mt-0.5" />
                <p className="text-sm text-red-700">
                  Error processing claim: {claimError || 'Unknown error'}
                </p>
              </div>
            </div>
          )}
          
          {isEligibleForClaim && canClaim && claimStatus !== 'success' && onClaim && (
            <button
              onClick={onClaim}
              disabled={claimStatus === 'loading'}
              className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {claimStatus === 'loading' ? (
                <>
                  <Loader className="animate-spin h-3 w-3 mr-2" />
                  Processing Claim...
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Claim Payout
                </>
              )}
            </button>
          )}
          
          {isEligibleForClaim && !canClaim && (
            <div className="mt-4 bg-blue-50 border border-blue-200 p-3 rounded-md text-blue-700 text-sm">
              <div className="flex items-center">
                <AlertTriangle className="h-3 w-3 mr-2 flex-shrink-0" />
                <p>
                  This policy has already been claimed or is no longer active.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClaimStatus;