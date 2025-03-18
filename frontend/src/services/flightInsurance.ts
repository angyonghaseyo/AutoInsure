import { ethers } from "ethers";
import { useWeb3 } from "../components/Web3Provider";

export enum PolicyStatus {
  Active = "Active",
  Expired = "Expired",
  Claimed = "Claimed",
  Cancelled = "Cancelled",
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
      purchasePolicy: async () => {
        throw new Error("Contract not initialized. Connect wallet first.");
      },
    };
  }

  /**
   * Fetch available policies.
   */
  async function getAvailablePolicies(): Promise<Policy[]> {
    if (!insurerContract) {
      console.error("Error: Insurer contract is not initialized.");
      return [];
    }

    try {
      const numPolicies = await insurerContract.numPolicyTypes();
      const policies: Policy[] = [];

      for (let i = 1; i <= numPolicies; i++) {
        const policy = await insurerContract.getPolicyDetails(i);
        policies.push({
          policyId: i,
          name: `Policy #${i}`,
          premium: ethers.formatEther(policy.premium),
          payoutAmount: ethers.formatEther(policy.maxPayout),
          delayThreshold: policy.numHoursDelay * 60,
          policyholder: "",
          flightNumber: "",
          departureTime: 0,
          isPaid: false,
          isClaimed: false,
          status: PolicyStatus.Active,
        });
      }

      return policies;
    } catch (error) {
      console.error("Error fetching policies:", error);
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
      const tx = await insurerContract.buyPolicy(policyTypeId, flightNumber, departureTime, {
        value: ethers.parseEther(premium),
      });

      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error("Error purchasing policy:", error);
      throw new Error("Transaction failed.");
    }
  }

  return { getAvailablePolicies, purchasePolicy };
}
