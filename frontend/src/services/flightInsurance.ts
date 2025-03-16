import { ethers } from 'ethers';

export enum PolicyStatus {
  Active = "Active",
  Expired = "Expired",
  Claimed = "Claimed",
  Cancelled = "Cancelled"
}

export interface Policy {
  policyId: number;
  policyholder: string;
  flightNumber: string;
  departureTime: number;
  premium: string;
  payoutAmount: string;
  isPaid: boolean;
  isClaimed: boolean;
  delayThreshold: number;
  status: PolicyStatus;
}

/**
 * Formats raw policy data from contract to a more usable format
 * @param policyData Raw policy data from the contract
 * @returns Formatted policy object
 */
export function formatPolicy(policyData: any): Policy {
  return {
    policyId: Number(policyData.policyId),
    policyholder: policyData.policyholder,
    flightNumber: policyData.flightNumber,
    departureTime: Number(policyData.departureTime),
    premium: ethers.formatEther(policyData.premium),
    payoutAmount: ethers.formatEther(policyData.payoutAmount),
    isPaid: policyData.isPaid,
    isClaimed: policyData.isClaimed,
    delayThreshold: Number(policyData.delayThreshold) / 60, // Convert from seconds to minutes
    status: policyData.status as PolicyStatus
  };
}

/**
 * Formats departure time to a human-readable string
 * @param timestamp Unix timestamp
 * @returns Formatted date and time string
 */
export function formatDepartureTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Gets the display text for a policy status
 * @param status Policy status enum value
 * @returns Human-readable status text
 */
export function getPolicyStatusText(status: PolicyStatus): string {
  return status;
}

/**
 * Gets the CSS color class for a policy status
 * @param status Policy status enum value
 * @returns Ant Design color class
 */
export function getPolicyStatusColor(status: PolicyStatus): string {
  switch (status) {
    case PolicyStatus.Active:
      return 'green';
    case PolicyStatus.Expired:
      return 'gray';
    case PolicyStatus.Claimed:
      return 'blue';
    case PolicyStatus.Cancelled:
      return 'red';
    default:
      return 'default';
  }
}

/**
 * Checks if a policy is eligible for claiming
 * @param policy Policy object
 * @returns Whether the policy can be claimed
 */
export function isEligibleForClaim(policy: Policy): boolean {
  const now = Math.floor(Date.now() / 1000);
  
  // Policy must be active and not already claimed/paid
  if (policy.status !== PolicyStatus.Active || policy.isPaid || policy.isClaimed) {
    return false;
  }
  
  // Policy must not be expired (24 hours after departure)
  const expirationTime = policy.departureTime + 24 * 60 * 60; // 24 hours in seconds
  if (now > expirationTime) {
    return false;
  }
  
  // Past departure time (can only claim after scheduled departure)
  return now > policy.departureTime;
}

/**
 * Checks if a policy is eligible for cancellation
 * @param policy Policy object
 * @returns Whether the policy can be cancelled
 */
export function isEligibleForCancellation(policy: Policy): boolean {
  const now = Math.floor(Date.now() / 1000);
  
  // Policy must be active and not already claimed/paid
  if (policy.status !== PolicyStatus.Active || policy.isPaid || policy.isClaimed) {
    return false;
  }
  
  // Policy can only be cancelled before departure
  return now < policy.departureTime;
}

/**
 * Calculates the payout amount based on the premium
 * @param premiumEther Premium amount in Ether
 * @param maxPayoutEther Maximum payout amount in Ether
 * @returns Payout amount in Ether
 */
export function calculatePayoutAmount(premiumEther: string, maxPayoutEther: string): string {
  const premium = parseFloat(premiumEther);
  const maxPayout = parseFloat(maxPayoutEther);
  
  // Payout is typically 3x the premium
  const calculatedPayout = premium * 3;
  
  // Cap at maximum payout
  return (calculatedPayout > maxPayout ? maxPayout : calculatedPayout).toString();
}
