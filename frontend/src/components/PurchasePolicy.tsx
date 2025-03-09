// components/PurchasePolicy.tsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useWeb3 } from './Web3Provider';
import { Calendar, Clock, DollarSign, AlertCircle, CheckCircle, Loader } from 'lucide-react';

// Custom checkmark component with strict size controls
const SmallCheckmark = ({ className = "" }) => (
  <span className="mr-2 flex-shrink-0" style={{ width: '12px', height: '12px', display: 'inline-flex' }}>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: '100%', maxHeight: '100%' }}>
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} />
    </svg>
  </span>
);

const PurchasePolicy: React.FC = () => {
  const { flightInsuranceContract, account } = useWeb3();
  
  // Form state
  const [flightNumber, setFlightNumber] = useState('');
  const [departureDate, setDepartureDate] = useState<Date | null>(
    new Date(new Date().getTime() + 24 * 60 * 60 * 1000) // Tomorrow
  );
  const [departureTime, setDepartureTime] = useState<string>('12:00');
  const [premium, setPremium] = useState('0.02');
  const [payoutEstimate, setPayoutEstimate] = useState('0.06');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [policyId, setPolicyId] = useState<string | null>(null);
  const [minPremium, setMinPremium] = useState<string>('0.01');
  const [step, setStep] = useState(1);
  
  // Get minimum premium from contract
  useEffect(() => {
    const getMinPremium = async () => {
      if (flightInsuranceContract) {
        try {
          const minPremiumWei = await flightInsuranceContract.minPremium();
          const formattedMin = ethers.formatEther(minPremiumWei);
          setMinPremium(formattedMin);
          
          // Set default premium to twice the minimum
          const defaultPremium = (parseFloat(formattedMin) * 2).toFixed(3);
          setPremium(defaultPremium);
          
          // Calculate initial payout estimate (3x premium)
          setPayoutEstimate((parseFloat(defaultPremium) * 3).toFixed(3));
        } catch (error) {
          console.error('Error getting minimum premium:', error);
        }
      }
    };
    
    getMinPremium();
  }, [flightInsuranceContract]);
  
  // Update payout estimate when premium changes
  useEffect(() => {
    try {
      const premiumValue = parseFloat(premium);
      if (!isNaN(premiumValue)) {
        setPayoutEstimate((premiumValue * 3).toFixed(3));
      }
    } catch (e) {
      // Ignore parse errors during typing
    }
  }, [premium]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset state
    setError(null);
    setSuccess(null);
    setPolicyId(null);
    
    // Validate form
    if (!flightNumber.trim()) {
      setError('Please enter a flight number');
      return;
    }
    
    if (!departureDate) {
      setError('Please select a departure date');
      return;
    }
    
    // Validate premium
    try {
      const premiumEther = parseFloat(premium);
      const minPremiumEther = parseFloat(minPremium);
      
      if (isNaN(premiumEther) || premiumEther < minPremiumEther) {
        setError(`Premium must be at least ${minPremium} ETH`);
        return;
      }
    } catch (err) {
      setError('Invalid premium amount');
      return;
    }
    
    if (!flightInsuranceContract) {
      setError('Web3 not initialized');
      return;
    }
    
    if (!account) {
      setError('Please connect your wallet');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Combine date and time
      const [hours, minutes] = departureTime.split(':').map(Number);
      const departureDateObj = new Date(departureDate);
      departureDateObj.setHours(hours, minutes, 0, 0);
      
      // Convert to Unix timestamp
      const departureTimestamp = Math.floor(departureDateObj.getTime() / 1000);
      
      // Format premium as wei
      const premiumWei = ethers.parseEther(premium);
      
      // Call contract function
      const tx = await flightInsuranceContract.purchasePolicy(
        flightNumber,
        departureTimestamp,
        { value: premiumWei }
      );
      
      setSuccess('Transaction submitted! Waiting for confirmation...');
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Find policy ID from event
      const policyPurchasedEvent = receipt.logs
        .filter((log: any) => 
          log.fragment && log.fragment.name === 'PolicyPurchased'
        )
        .map((log: any) => ({
          policyId: log.args[0].toString(),
          policyholder: log.args[1],
          flightNumber: log.args[2],
          departureTime: log.args[3].toString()
        }))[0];
      
      if (policyPurchasedEvent) {
        setPolicyId(policyPurchasedEvent.policyId);
        setSuccess(`Successfully purchased policy #${policyPurchasedEvent.policyId} for flight ${flightNumber}`);
        
        // Reset form
        setFlightNumber('');
        setDepartureDate(new Date(new Date().getTime() + 24 * 60 * 60 * 1000));
        setDepartureTime('12:00');
        setPremium((parseFloat(minPremium) * 2).toFixed(3));
      } else {
        setSuccess('Policy purchased successfully!');
      }
    } catch (err: any) {
      console.error('Error purchasing policy:', err);
      setError(err.message || 'An error occurred while purchasing the policy');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const nextStep = () => {
    if (step === 1 && !flightNumber.trim()) {
      setError('Please enter a flight number');
      return;
    }
    if (step === 2 && !departureDate) {
      setError('Please select a departure date and time');
      return;
    }
    setError(null);
    setStep(step + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep(step - 1);
  };
  
  return (
    <div className="max-w-md mx-auto">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 flex items-start">
          <span className="mr-2 mt-0.5 flex-shrink-0" style={{ width: '12px', height: '12px', display: 'inline-flex' }}>
            <AlertCircle className="h-3 w-3" style={{ maxHeight: '12px', maxWidth: '12px' }} />
          </span>
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md mb-6 flex items-start">
          <span className="mr-2 mt-0.5 flex-shrink-0" style={{ width: '12px', height: '12px', display: 'inline-flex' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500" />
            </svg>
          </span>
          <div>
            <p>{success}</p>
            {policyId && (
              <p className="mt-2 font-semibold">Policy ID: {policyId}</p>
            )}
          </div>
        </div>
      )}
      
      {/* Stepper Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
            <span className="text-xs mt-1 text-gray-500">Flight</span>
          </div>
          <div className={`h-1 flex-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className="flex flex-col items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
            <span className="text-xs mt-1 text-gray-500">Date</span>
          </div>
          <div className={`h-1 flex-1 mx-2 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className="flex flex-col items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>3</div>
            <span className="text-xs mt-1 text-gray-500">Payment</span>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Enter Flight Details</h3>
            <div>
              <label htmlFor="flightNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Flight Number
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="text"
                  id="flightNumber"
                  className="block w-full pr-10 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., AA123"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  required
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Please enter your flight number as shown on your boarding pass or ticket.
              </p>
            </div>
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next
                <span className="ml-2 flex-shrink-0" style={{ width: '12px', height: '12px', display: 'inline-flex' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Flight Departure Details</h3>
            <div>
              <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700 mb-1">
                Departure Date
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ width: '12px', height: '12px' }}>
                  <Calendar className="h-3 w-3 text-gray-400" />
                </div>
                <DatePicker
                  id="departureDate"
                  selected={departureDate}
                  onChange={(date) => setDepartureDate(date)}
                  className="block w-full pl-10 pr-3 py-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  minDate={new Date()}
                  required
                  dateFormat="MMMM d, yyyy"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="departureTime" className="block text-sm font-medium text-gray-700 mb-1">
                Departure Time
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ width: '12px', height: '12px' }}>
                  <Clock className="h-3 w-3 text-gray-400" />
                </div>
                <input
                  type="time"
                  id="departureTime"
                  className="block w-full pl-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-700 flex items-start">
              <span className="mr-2 mt-0.5 flex-shrink-0" style={{ width: '12px', height: '12px', display: 'inline-flex' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400" />
                </svg>
              </span>
              <div>
                <p>Your coverage will begin 4 hours before your departure time and will remain active for up to 24 hours after your scheduled departure.</p>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="mr-2 flex-shrink-0" style={{ width: '12px', height: '12px', display: 'inline-flex' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next
                <span className="ml-2 flex-shrink-0" style={{ width: '12px', height: '12px', display: 'inline-flex' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Payment Details</h3>
            
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-md mb-4">
              <h4 className="font-medium text-gray-800 mb-3">Review Flight Details</h4>
              <div className="grid grid-cols-2 gap-4 mb-1">
                <div className="text-sm text-gray-500">Flight Number:</div>
                <div className="text-sm font-medium text-gray-900">{flightNumber}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-sm text-gray-500">Departure:</div>
                <div className="text-sm font-medium text-gray-900">
                  {formatDate(departureDate)} at {departureTime}
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="premium" className="block text-sm font-medium text-gray-700 mb-1">
                Premium Amount (ETH)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ width: '12px', height: '12px' }}>
                  <DollarSign className="h-3 w-3 text-gray-500" />
                </div>
                <input
                  type="number"
                  id="premium"
                  className="block w-full pl-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  step="0.001"
                  min={minPremium}
                  value={premium}
                  onChange={(e) => setPremium(e.target.value)}
                  required
                />
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-gray-500">Minimum premium: {minPremium} ETH</span>
                <span className="text-blue-600 font-medium">Payout: ~{payoutEstimate} ETH</span>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-700 mb-2">
              <p className="font-semibold">Policy Terms:</p>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li className="flex items-start">
                  <SmallCheckmark className="text-blue-500" />
                  <span>Coverage for flights delayed by 2+ hours</span>
                </li>
                <li className="flex items-start">
                  <SmallCheckmark className="text-blue-500" />
                  <span>Payout is 3x your premium amount</span>
                </li>
                <li className="flex items-start">
                  <SmallCheckmark className="text-blue-500" />
                  <span>Automatic processing via Chainlink oracles</span>
                </li>
                <li className="flex items-start">
                  <SmallCheckmark className="text-blue-500" />
                  <span>Cancellation available before departure (50% refund)</span>
                </li>
              </ul>
            </div>
            
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="mr-2 flex-shrink-0" style={{ width: '12px', height: '12px', display: 'inline-flex' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                Back
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={isLoading || !flightInsuranceContract || !account}
              >
                {isLoading ? (
                  <>
                    <span className="mr-2 flex-shrink-0" style={{ width: '12px', height: '12px', display: 'inline-flex' }}>
                      <svg className="animate-spin h-3 w-3" width="12" height="12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                    Processing...
                  </>
                ) : (
                  'Purchase Insurance'
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default PurchasePolicy;