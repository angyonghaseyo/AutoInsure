import { ethers } from "ethers";
import { useWeb3 } from "../components/Web3Provider";

export enum PolicyStatus {
  Active = "Active",
  Expired = "Expired",
  Claimed = "Claimed",
  Discontinued = "Discontinued",
}

export interface Policy {
  policyId: number;
  name: string;
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

export function useFlightInsurance() {
  const { insurerContract, signer, account } = useWeb3();

  if (!insurerContract || !signer) {
    console.error("Web3 is not initialized. Connect wallet first.");
    return {
      getAvailablePolicies: async () => [],
      getUserPolicies: async () => [],
      purchasePolicy: async () => {
        throw new Error("Contract not initialized. Connect wallet first.");
      },
      claimPolicy: async () => {
        throw new Error("Contract not initialized. Connect wallet first.");
      },
    };
  }

  /**
   * Fetch available policies from the blockchain.
   */
  async function getAvailablePolicies(): Promise<Policy[]> {
    if (!insurerContract) {
      console.error("Error: Insurer contract is not initialized.");
      return [];
    }

    try {
      const policies = await insurerContract?.getCompanyPolicies(false);
      if (!policies) return [];

      return policies.map((policy: any, index: number) => ({
        policyId: index + 1,
        name: `Policy #${index + 1}`,
        premium: ethers.formatEther(policy.premium),
        payoutAmount: ethers.formatEther(policy.maxPayout),
        delayThreshold: policy.delayThreshold,
        policyholder: "",
        flightNumber: "",
        departureTime: 0,
        isPaid: false,
        isClaimed: false,
        status: policy.status,
      }));
    } catch (error) {
      console.error("Error fetching available policies:", error);
      return [];
    }
  }

  /**
   * Fetch policies owned by the current user.
   */
  async function getUserPolicies(): Promise<Policy[]> {
    if (!account || !insurerContract) {
      console.error("Error: No connected wallet or contract not initialized.");
      return [];
    }

    try {
      const policies = await insurerContract?.getPolicyOfCustomer(true, account);
      if (!policies) return [];

      return policies.map((policy: any) => ({
        policyId: policy.policyId,
        name: `Policy #${policy.policyId}`,
        policyholder: policy.insured,
        flightNumber: policy.flightNumbers?.[0] || "N/A",
        departureTime: Number(policy.departureTimes?.[0]) || 0,
        premium: ethers.formatEther(policy.premium),
        payoutAmount: ethers.formatEther(policy.maxPayout),
        isPaid: false,
        isClaimed: policy.status === PolicyStatus.Claimed,
        delayThreshold: policy.delayThreshold,
        status: policy.status,
      }));
    } catch (error) {
      console.error("Error fetching user policies:", error);
      return [];
    }
  }

  /**
   * Purchase a policy.
   */
  async function purchasePolicy(
    policyTypeId: number,
    flightNumber: string,
    departureTime: number,
    premium: string
  ) {
    if (!insurerContract) {
      throw new Error("Error: Contract is not initialized.");
    }

    try {
      const tx = await insurerContract?.buyPolicy(policyTypeId, flightNumber, departureTime, {
        value: ethers.parseEther(premium),
      });

      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error("Error purchasing policy:", error);
      throw new Error("Transaction failed.");
    }
  }

  /**
   * Claim an active policy payout.
   */
  async function claimPolicy() {
    if (!insurerContract) {
      throw new Error("Error: Contract is not initialized.");
    }

    try {
      const tx = await insurerContract?.claimPolicy();
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error("Error claiming policy:", error);
      throw new Error("Claim transaction failed.");
    }
  }

  return { getAvailablePolicies, getUserPolicies, purchasePolicy, claimPolicy };
}
