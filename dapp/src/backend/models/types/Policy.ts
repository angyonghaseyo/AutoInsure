/**
 * Policy status enum
 */
export enum PolicyStatus {
    Active = 'Active',
    Expired = 'Expired',
    Claimed = 'Claimed',
    Cancelled = 'Cancelled'
  }
  
  /**
   * Policy interface representing a flight insurance policy
   */
  export interface Policy {
    // Blockchain-related fields
    policyId: number;
    transactionHash: string;
    blockNumber: number;
  
    // Policy details
    templateId: number;
    name: string;
    policyholder: string;
    flightNumber: string;
    departureAirportCode: string;
    arrivalAirportCode: string;
    departureTime: Date;
    premium: string;
    payoutAmount: string;
    delayThreshold: number;
  
    // Status tracking
    status: PolicyStatus;
    isPaid: boolean;
    isClaimed: boolean;
    payoutTransaction: string | null;
  
    // Additional metadata not stored on blockchain
    actualDepartureTime?: Date | null;
    delayMinutes?: number;
    delayReason?: string | null;
    notes?: string | null;
    emailNotifications?: boolean;
    customerEmail?: string | null;
    
    // MongoDB timestamps
    createdAt: Date;
    updatedAt: Date;
  }
  
  /**
   * Partial policy interface for updates
   */
  export type PolicyUpdate = Partial<Policy>;
  
  /**
   * Policy create interface with required fields
   */
  export type PolicyCreate = Omit<Policy, 'createdAt' | 'updatedAt'>;