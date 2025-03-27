import { connectToDatabase } from '../lib/mongodb';
import { User, UserUpdate, UserProfile, UserRole } from '../models/types/User';
import { findDocumentById, updateDocument } from '../utils/db-helpers';
import { getPoliciesByAddress } from './policyService';

// Collection name
const COLLECTION = 'users';

/**
 * Get a user by Ethereum address
 */
export async function getUserByAddress(address: string): Promise<User | null> {
  const normalizedAddress = address.toLowerCase();
  return findDocumentById<User>(COLLECTION, normalizedAddress, 'address');
}

/**
 * Get user profile with policies
 */
export async function getUserProfile(address: string): Promise<UserProfile | null> {
  const normalizedAddress = address.toLowerCase();
  const { db } = await connectToDatabase();
  
  // Get user from database or create if not exists
  let user = await getUserByAddress(normalizedAddress);
  
  if (!user) {
    // Create new user
    const newUser: User = {
      address: normalizedAddress,
      notificationsEnabled: false,
      lastLogin: new Date(),
      role: UserRole.User,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection<User>(COLLECTION).insertOne(newUser);
    user = newUser;
  } else {
    // Update last login
    await updateUserByAddress(normalizedAddress, { 
      lastLogin: new Date() 
    });
  }
  
  // Get user's policies
  const policies = await getPoliciesByAddress(normalizedAddress);
  const policyIds = policies.map(policy => policy.policyId);
  
  return {
    ...user,
    policies: policyIds,
    policyCount: policyIds.length
  };
}

/**
 * Create or update a user
 */
export async function upsertUser(address: string, userData: Partial<User>): Promise<User> {
  const normalizedAddress = address.toLowerCase();
  const { db } = await connectToDatabase();
  
  const now = new Date();
  
  // Default user data
  const defaultUser: User = {
    address: normalizedAddress,
    notificationsEnabled: false,
    lastLogin: now,
    role: UserRole.User,
    createdAt: now,
    updatedAt: now
  };
  
  // Merge with provided user data
  const mergedUser = {
    ...defaultUser,
    ...userData,
    address: normalizedAddress, // Ensure address is normalized
    updatedAt: now
  };
  
  // Upsert user
  const result = await db.collection<User>(COLLECTION).findOneAndUpdate(
    { address: normalizedAddress },
    { $set: mergedUser },
    { upsert: true, returnDocument: 'after' }
  );
  
  return result as unknown as User;
}

/**
 * Update a user by address
 */
export async function updateUserByAddress(
  address: string,
  update: UserUpdate
): Promise<User | null> {
  const normalizedAddress = address.toLowerCase();
  return updateDocument<User>(COLLECTION, normalizedAddress, update, 'address');
}