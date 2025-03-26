import { ethers } from "ethers";
import { useWeb3 } from "../components/Web3Provider";

// Enum mapping to Solidity's PolicyStatus
export enum PolicyStatus {
  Active = 0,
  Expired = 1,
  Claimed = 2,
  Discontinued = 3,
}

// Type for policy templates defined by the insurer
export interface PolicyTemplate {
  templateId: number;
  activeDuration: number;
  premium: string;
  delayPayout: string;
  delayThreshold: number;
  maxPayout: string;
  status: PolicyStatus;
}

// Type for actual user-purchased policies
export interface UserPolicy {
  policyId: number;
  templateId: number;
  flightNumber: string;
  departureTime: number;
  creationDate: number;
  payoutToDate: string;
  insured: string;
  status: PolicyStatus;
  isClaimed: boolean;
  isPaid: boolean;
}

/**
 * Format raw template from contract to frontend format
 */
function formatPolicyTemplate(raw: any): PolicyTemplate {
  return {
    templateId: Number(raw.templateId),
    activeDuration: Number(raw.activeDuration),
    premium: ethers.formatEther(raw.premium),
    delayPayout: ethers.formatEther(raw.delayPayout),
    delayThreshold: Number(raw.delayThreshold),
    maxPayout: ethers.formatEther(raw.maxPayout),
    status: Number(raw.status),
  };
}

/**
 * Format raw user policy from contract to frontend format
 */
function formatUserPolicy(raw: any): UserPolicy {
  const payoutToDate = ethers.formatEther(raw.payoutToDate);

  return {
    policyId: Number(raw.policyId),
    templateId: Number(raw.templateId),
    flightNumber: raw.flightNumber,
    departureTime: Number(raw.departureTime),
    creationDate: Number(raw.creationDate),
    payoutToDate,
    insured: raw.insured,
    status: Number(raw.status),
    isClaimed: Number(raw.status) === PolicyStatus.Claimed,
    isPaid: !!raw.payoutToDate && BigInt(raw.payoutToDate.toString()) > 0n,
  };
}

export function useFlightInsurance() {
  const { insurerContract, account } = useWeb3();

  /**
   * Get all policy templates (company-defined types).
   */
  async function getCompanyPolicies(): Promise<PolicyTemplate[]> {
    if (!insurerContract) return [];
    try {
      const templates = await insurerContract.getCompanyPolicies();
      return templates.map(formatPolicyTemplate);
    } catch (error) {
      console.error("Error fetching company templates:", error);
      return [];
    }
  }

  /**
   * Get all user policies purchased by the connected account.
   */
  async function getUserPolicies(): Promise<UserPolicy[]> {
    if (!account || !insurerContract) return [];
    try {
      const policies = await insurerContract.getPolicyOfCustomer(account);
      return policies.map(formatUserPolicy);
    } catch (error) {
      console.error("Error fetching user policies:", error);
      return [];
    }
  }

  /**
   * Create a new policy template (company only).
   */
  async function createPolicyTemplate(
    activeDuration: number,
    premium: number,
    delayPayout: number,
    delayThreshold: number,
    maxPayout: number
  ): Promise<void> {
    if (!insurerContract) throw new Error("Contract not initialized");
    const tx = await insurerContract.createPolicyTemplate(
      activeDuration,
      premium,
      delayPayout,
      delayThreshold,
      maxPayout
    );
    await tx.wait();
  }

  /**
   * Delete a policy template by its ID (company only).
   */
  async function deletePolicyTemplate(templateId: number): Promise<void> {
    if (!insurerContract) throw new Error("Contract not initialized");
    const tx = await insurerContract.deletePolicyTemplate(templateId);
    await tx.wait();
  }

  /**
   * Purchase a policy based on a template ID and flight details.
   */
  async function purchasePolicy(
    templateId: number,
    flightNumber: string,
    departureTime: number,
    premiumInEth: string
  ): Promise<string> {
    if (!insurerContract) throw new Error("Contract not initialized");
    const tx = await insurerContract.purchasePolicy(
      templateId,
      flightNumber,
      departureTime,
      { value: ethers.parseEther(premiumInEth) }
    );
    await tx.wait();
    return tx.hash;
  }

  /**
   * Claim payout for a user policy by index.
   */
  async function claimPolicy(policyIndex: number): Promise<string> {
    if (!insurerContract) throw new Error("Contract not initialized");
    const tx = await insurerContract.claimPolicy(policyIndex);
    await tx.wait();
    return tx.hash;
  }

  /**
   * Check if the given address is the company
   */
  async function isCompany(userAddress: string): Promise<boolean> {
    if (!insurerContract) return false;
    try {
      return await insurerContract.isCompany(userAddress);
    } catch (error) {
      console.error("Error checking company role:", error);
      return false;
    }
  }

  return {
    // Templates
    getCompanyPolicies,
    createPolicyTemplate,
    deletePolicyTemplate,

    // User Policies
    getUserPolicies,
    purchasePolicy,
    claimPolicy,

    // Access control
    isCompany,
  };
}
