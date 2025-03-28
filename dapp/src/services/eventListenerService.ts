import { ethers } from 'ethers';
import { savePolicy, updatePolicyStatus, markPolicyAsClaimed } from './policyService';
import { PolicyStatus } from '../backend/models/types/Policy';

// ABI interfaces
import InsurerABI from '../utils/abis/Insurer.json';
import FlightPolicyABI from '../utils/abis/FlightPolicy.json';

// Address constant
import contractAddresses from '../utils/contractAddresses.json';

// Type for listeners
interface EventListeners {
  removeAllListeners: () => void;
}

// Type for contract addresses by chain
interface ContractAddresses {
  [chainId: string]: {
    Insurer: string;
    FlightPolicy: string;
  };
}

/**
 * Initialize blockchain event listeners to sync with MongoDB
 */
export function initializeEventListeners(
  provider: ethers.Provider,
  chainId: number
): EventListeners[] {
  // Check if we have addresses for this chain
  const chainAddresses = (contractAddresses as ContractAddresses)[chainId.toString()];
  if (!chainAddresses) {
    console.warn(`No contract addresses found for chain ID ${chainId}`);
    return [];
  }

  // Create contract instances
  const insurerContract = new ethers.Contract(
    chainAddresses.Insurer,
    InsurerABI.abi,
    provider
  );
  
  const flightPolicyContract = new ethers.Contract(
    chainAddresses.FlightPolicy,
    FlightPolicyABI.abi,
    provider
  );

  // Array to track all listeners
  const listeners: EventListeners[] = [];

  // FlightPolicyPurchased event
  const policyPurchasedListener = {
    removeAllListeners: () => {
      insurerContract.removeAllListeners('FlightPolicyPurchased');
    }
  };
  
  insurerContract.on(
    'FlightPolicyPurchased',
    async (buyer: string, policyId: bigint, templateId: bigint, event: ethers.EventLog | ethers.Log) => {
      try {
        console.log(`New policy purchased: ID ${policyId}, Buyer: ${buyer}`);
        
        // Wait for transaction to be mined (1 confirmation)
        const tx = await event.getTransaction();
        const receipt = await tx.wait(1);
        
        // Get policy details from the blockchain
        const [userPolicy, template] = await insurerContract.getFlightPolicyWithTemplate(buyer, policyId);
        
        // Format policy data for MongoDB
        const policyData = {
          policyId: Number(policyId),
          templateId: Number(templateId),
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          name: template.name,
          policyholder: buyer.toLowerCase(),
          flightNumber: userPolicy.flightNumber,
          departureAirportCode: userPolicy.departureAirportCode,
          arrivalAirportCode: userPolicy.arrivalAirportCode,
          departureTime: new Date(Number(userPolicy.departureTime) * 1000),
          premium: ethers.formatEther(template.premium),
          payoutAmount: ethers.formatEther(template.maxTotalPayout),
          delayThreshold: Number(template.delayThresholdHours) * 60, // Convert to minutes
          status: PolicyStatus.Active,
          isPaid: false,
          isClaimed: false,
          payoutTransaction: null,
        };
        
        // Save to MongoDB
        await savePolicy(policyData);
      } catch (error) {
        console.error('Error processing policy purchase event:', error);
      }
    }
  );
  listeners.push(policyPurchasedListener);

  // FlightPolicyClaimed event
  const policyClaimedListener = {
    removeAllListeners: () => {
      insurerContract.removeAllListeners('FlightPolicyClaimed');
    }
  };
  
  insurerContract.on(
    'FlightPolicyClaimed',
    async (policyId: bigint, amount: bigint, buyer: string, event: ethers.EventLog | ethers.Log) => {
      try {
        console.log(`Policy claimed: ID ${policyId}, Amount: ${ethers.formatEther(amount)} ETH`);
        
        // Update policy status in MongoDB
        await markPolicyAsClaimed(Number(policyId), event.transactionHash);
      } catch (error) {
        console.error('Error processing policy claim event:', error);
      }
    }
  );
  listeners.push(policyClaimedListener);

  // FlightPolicyCancelled event
  const policyCancelledListener = {
    removeAllListeners: () => {
      insurerContract.removeAllListeners('FlightPolicyCancelled');
    }
  };
  
  insurerContract.on(
    'FlightPolicyCancelled',
    async (policyId: bigint, buyer: string, event: ethers.EventLog | ethers.Log) => {
      try {
        console.log(`Policy cancelled: ID ${policyId}, Buyer: ${buyer}`);
        
        // Update policy status in MongoDB
        await updatePolicyStatus(Number(policyId), PolicyStatus.Cancelled);
      } catch (error) {
        console.error('Error processing policy cancellation event:', error);
      }
    }
  );
  listeners.push(policyCancelledListener);
  
  // FlightPolicyExpired event
  const policyExpiredListener = {
    removeAllListeners: () => {
      insurerContract.removeAllListeners('FlightPolicyExpired');
    }
  };
  
  insurerContract.on(
    'FlightPolicyExpired',
    async (policyId: bigint, event: ethers.EventLog | ethers.Log) => {
      try {
        console.log(`Policy expired: ID ${policyId}`);
        
        // Update policy status in MongoDB
        await updatePolicyStatus(Number(policyId), PolicyStatus.Expired);
      } catch (error) {
        console.error('Error processing policy expiration event:', error);
      }
    }
  );
  listeners.push(policyExpiredListener);

  return listeners;
}

/**
 * Remove all event listeners
 */
export function removeEventListeners(listeners: EventListeners[]): void {
  listeners.forEach(listener => {
    if (listener && typeof listener.removeAllListeners === 'function') {
      listener.removeAllListeners();
    }
  });
}