import { connectToDatabase } from '../lib/mongodb';
import { Policy, PolicyCreate, PolicyUpdate, PolicyStatus } from '../models/types/Policy';
import { 
  findDocuments, 
  findDocumentById, 
  insertDocument, 
  updateDocument, 
  deleteDocument 
} from '../utils/db-helpers';

// Collection name
const COLLECTION = 'policies';

/**
 * Get all policies with optional filtering
 */
export async function getPolicies(
  filter: Partial<Policy> = {},
  limit: number = 100,
  skip: number = 0
): Promise<Policy[]> {
  return findDocuments<Policy>(COLLECTION, filter, { createdAt: -1 }, limit, skip);
}

/**
 * Get a single policy by policy ID
 */
export async function getPolicyById(policyId: number): Promise<Policy | null> {
  return findDocumentById<Policy>(COLLECTION, policyId, 'policyId');
}

/**
 * Get policies by policyholder address
 */
export async function getPoliciesByAddress(address: string): Promise<Policy[]> {
  const normalizedAddress = address.toLowerCase();
  return findDocuments<Policy>(COLLECTION, { policyholder: normalizedAddress });
}

/**
 * Create a new policy
 */
export async function createPolicy(policy: PolicyCreate): Promise<Policy> {
  return insertDocument<Policy>(COLLECTION, policy as Policy);
}

/**
 * Update a policy by policy ID
 */
export async function updatePolicy(policyId: number, update: PolicyUpdate): Promise<Policy | null> {
  return updateDocument<Policy>(COLLECTION, policyId, update, 'policyId');
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
    ...additionalData
  });
}

/**
 * Mark policy as claimed
 */
export async function markPolicyAsClaimed(
  policyId: number,
  payoutTransaction: string
): Promise<Policy | null> {
  return updatePolicy(policyId, {
    status: PolicyStatus.Claimed,
    isPaid: true,
    isClaimed: true,
    payoutTransaction
  });
}

/**
 * Delete a policy (typically only for development/testing)
 */
export async function deletePolicy(policyId: number): Promise<boolean> {
  return deleteDocument<Policy>(COLLECTION, policyId, 'policyId');
}

/**
 * Get eligible policies for claiming
 */
export async function getEligiblePoliciesForClaim(): Promise<Policy[]> {
  const { db } = await connectToDatabase();
  
  // Find active policies with departure time in the past
  return db.collection<Policy>(COLLECTION).find({
    status: PolicyStatus.Active,
    isPaid: false,
    isClaimed: false,
    departureTime: { $lt: new Date() }
  }).toArray();
}