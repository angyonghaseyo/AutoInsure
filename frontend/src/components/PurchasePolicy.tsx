import React, { useState } from 'react';
import { ethers } from 'ethers';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useWeb3 } from './Web3Provider';
import Loader from './Loader';

const PurchasePolicy: React.FC = () => {
  const { flightInsuranceContract, account } = useWeb3();
  
  // Form state
  const [flightNumber, setFlightNumber] = useState('');
  const [departureDate, setDepartureDate] = useState<Date | null>(new Date());
  const [departureTime, setDepartureTime] = useState<string>('12:00');
  const [premium, setPremium] = useState('0.02');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [policyId, setPolicyId] = useState<string | null>(null);
  const [minPremium, setMinPremium] = useState<string>('0.01');
  
  // Get minimum premium from contract
  React.useEffect(() => {
    const getMinPremium = async () => {
      if (flightInsuranceContract) {
        try {
          const minPremiumWei = await flightInsuranceContract.minPremium();
          setMinPremium(ethers.formatEther(minPremiumWei));
          // Set default premium to twice the minimum
          setPremium(ethers.formatEther(minPremiumWei * BigInt(2)));
        } catch (error) {
          console.error('Error getting minimum premium:', error);
        }
      }
    };
    
    getMinPremium();
  }, [flightInsuranceContract]);
  
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
        setDepartureDate(new Date());
        setDepartureTime('12:00');
        setPremium(ethers.formatEther(ethers.parseEther(minPremium) * BigInt(2)));
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
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Purchase Flight Insurance</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4">
          {success}
          {policyId && (
            <div className="mt-2">
              Policy ID: <span className="font-bold">{policyId}</span>
            </div>
          )}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="flightNumber" className="block text-gray-700 font-medium mb-1">
            Flight Number
          </label>
          <input
            type="text"
            id="flightNumber"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., AA123"
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="departureDate" className="block text-gray-700 font-medium mb-1">
            Departure Date
          </label>
          <DatePicker
            id="departureDate"
            selected={departureDate}
            onChange={(date) => setDepartureDate(date)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            minDate={new Date()}
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="departureTime" className="block text-gray-700 font-medium mb-1">
            Departure Time
          </label>
          <input
            type="time"
            id="departureTime"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="premium" className="block text-gray-700 font-medium mb-1">
            Premium Amount (ETH)
          </label>
          <div className="relative">
            <input
              type="number"
              id="premium"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.001"
              min={minPremium}
              value={premium}
              onChange={(e) => setPremium(e.target.value)}
              required
            />
            <div className="text-sm text-gray-500 mt-1">
              Minimum premium: {minPremium} ETH
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={isLoading || !flightInsuranceContract || !account}
        >
          {isLoading ? <Loader size="sm" /> : 'Purchase Insurance'}
        </button>
      </form>
    </div>
  );
};

export default PurchasePolicy;