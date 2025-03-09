import React from 'react';
import { Policy, formatDepartureTime, getPolicyStatusText, getPolicyStatusColor, isEligibleForClaim, isEligibleForCancellation } from '../services/flightInsurance';
import { Plane, Calendar, Clock, CreditCard, AlertTriangle } from 'lucide-react';
import Loader from './Loader';

interface ViewPolicyProps {
  policy: Policy;
  onClaim: (policyId: number) => void;
  onCancel: (policyId: number) => void;
  isProcessing: boolean;
}

const ViewPolicy: React.FC<ViewPolicyProps> = ({ policy, onClaim, onCancel, isProcessing }) => {
  // Get readable status
  const statusClass = (() => {
    switch (policy.status) {
      case 0: // Active
        return 'bg-green-100 text-green-800 border-green-200';
      case 1: // Expired
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 2: // Claimed
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 3: // Cancelled
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  })();

  // Format the date for better readability
  const formattedDate = (() => {
    const date = new Date(policy.departureTime * 1000);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  })();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition hover:shadow-md">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-full mr-3">
              <Plane className="h-3 w-3" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Flight {policy.flightNumber}
              </h3>
              <div className="flex items-center text-gray-500 text-sm mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusClass}`}>
              {getPolicyStatusText(policy.status)}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-5">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Policy ID</p>
            <p className="font-medium text-gray-900">#{policy.policyId}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Premium</p>
            <p className="font-medium text-gray-900">{policy.premium} ETH</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Payout Amount</p>
            <p className="font-medium text-blue-600">{policy.payoutAmount} ETH</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Delay Threshold</p>
            <p className="font-medium text-gray-900">{policy.delayThreshold} min</p>
          </div>
        </div>
        
        {policy.status === 0 && !policy.isPaid && policy.departureTime < Math.floor(Date.now() / 1000) && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3 mb-4 flex items-center text-sm">
            <AlertTriangle className="h-3 w-3 text-yellow-500 mr-2 flex-shrink-0" />
            <span className="text-yellow-700">
              Your flight has departed. You can check for claim eligibility once flight data is available.
            </span>
          </div>
        )}
        
        <div className="flex justify-end space-x-3 mt-2">
          {isEligibleForClaim(policy) && (
            <button
              onClick={() => onClaim(policy.policyId)}
              disabled={isProcessing}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Processing...
                </>
              ) : (
                'Claim Payout'
              )}
            </button>
          )}
          
          {isEligibleForCancellation(policy) && (
            <button
              onClick={() => onCancel(policy.policyId)}
              disabled={isProcessing}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Processing...
                </>
              ) : (
                'Cancel Policy'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewPolicy;