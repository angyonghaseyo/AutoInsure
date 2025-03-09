import React from 'react';
import { Policy, formatDepartureTime, getPolicyStatusText, getPolicyStatusColor, isEligibleForClaim, isEligibleForCancellation } from '../utils/flightInsurance';
import Loader from './Loader';

interface ViewPolicyProps {
  policy: Policy;
  onClaim: (policyId: number) => void;
  onCancel: (policyId: number) => void;
  isProcessing: boolean;
}

const ViewPolicy: React.FC<ViewPolicyProps> = ({ policy, onClaim, onCancel, isProcessing }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold">
            Flight {policy.flightNumber}
          </h3>
          <p className="text-gray-600 mt-1">
            Departure: {formatDepartureTime(policy.departureTime)}
          </p>
        </div>
        <div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPolicyStatusColor(policy.status)}`}>
            {getPolicyStatusText(policy.status)}
          </span>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Policy ID</p>
          <p className="font-medium">{policy.policyId}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Premium</p>
          <p className="font-medium">{policy.premium} ETH</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Payout Amount</p>
          <p className="font-medium">{policy.payoutAmount} ETH</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Delay Threshold</p>
          <p className="font-medium">{policy.delayThreshold} minutes</p>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end space-x-3">
        {isEligibleForClaim(policy) && (
          <button
            onClick={() => onClaim(policy.policyId)}
            disabled={isProcessing}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isProcessing ? <Loader size="sm" /> : 'Claim Payout'}
          </button>
        )}
        
        {isEligibleForCancellation(policy) && (
          <button
            onClick={() => onCancel(policy.policyId)}
            disabled={isProcessing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isProcessing ? <Loader size="sm" /> : 'Cancel Policy'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ViewPolicy;