/**
 * User role enum
 */
export enum UserRole {
    User = 'user',
    Insurer = 'insurer',
    Admin = 'admin'
  }
  
  /**
   * User interface representing a user of the flight insurance platform
   */
  export interface User {
    // Ethereum address (used as unique identifier)
    address: string;
    
    // Personal information
    email?: string | null;
    name?: string | null;
    
    // Settings and preferences
    notificationsEnabled: boolean;
    lastLogin: Date;
    role: UserRole;
    preferences?: Record<string, string>;
    
    // MongoDB timestamps
    createdAt: Date;
    updatedAt: Date;
  }
  
  /**
   * Partial user interface for updates
   */
  export type UserUpdate = Partial<User>;
  
  /**
   * User profile interface with associated policies
   */
  export interface UserProfile extends User {
    policies: number[];
    policyCount: number;
  }