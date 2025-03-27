import { ethers } from 'ethers';
import { Policy, PolicyStatus } from '../backend/models/types/Policy';

// Base API URL
const API_URL = '/api';

/**
 * Get all policies with optional filtering
 */
export async function fetchPolicies(
  filters: Record<string, any> = {}
): Promise<Policy[]> {
  try {
    // Build query string from filters
    const queryString = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');
    
    const url = `${API_URL}/policies${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error fetching policies: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching policies:', error);
    return [];
  }
}

/**
 * Get policies for a specific user
 */
export async function fetchUserPolicies(address: string): Promise<Policy[]> {
  return fetchPolicies({ policyholder: address });
}

/**
 * Get a specific policy by ID
 */
export async function fetchPolicyById(policyId: number): Promise<Policy | null> {
  try {
    const response = await fetch(`${API_URL}/policies/${policyId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error fetching policy: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching policy ${policyId}:`, error);
    return null;
  }
}

/**
 * Save a policy to the database (called after blockchain transaction)
 */
export async function savePolicy(
  policy: Omit<Policy, 'createdAt' | 'updatedAt'>,
): Promise<Policy | null> {
  try {
    const response = await fetch(`${API_URL}/policies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(policy),
    });
    
    if (!response.ok) {
      throw new Error(`Error saving policy: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error saving policy:', error);
    return null;
  }
}

/**
 * Update a policy
 */
export async function updatePolicy(
  policyId: number,
  updates: Partial<Policy>
): Promise<Policy | null> {
  try {
    const response = await fetch(`${API_URL}/policies/${policyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error(`Error updating policy: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error updating policy ${policyId}:`, error);
    return null;
  }
}

/**
 * Update policy status
 */
export async function updatePolicyStatus(
  policyId: number,
  status: PolicyStatus,
  additionalData: Partial<Policy> = {}
): Promise<Policy | null> {
  return updatePolicy(policyId, {
    status,
    ...additionalData,
  });
}

/**
 * Mark policy as claimed after blockchain transaction
 */
export async function markPolicyAsClaimed(
  policyId: number,
  transactionHash: string
): Promise<Policy | null> {
  return updatePolicy(policyId, {
    status: PolicyStatus.Claimed,
    isPaid: true,
    isClaimed: true,
    payoutTransaction: transactionHash,
  });
}

/**
 * Check if a policy can be claimed
 */
export function isPolicyClaimable(policy: Policy): boolean {
  return (
    policy.status === PolicyStatus.Active &&
    !policy.isPaid &&
    !policy.isClaimed &&
    new Date(policy.departureTime) < new Date()
  );
}