import { ethers } from "ethers";
import { useWeb3 } from "../components/Web3Provider";

export enum PolicyStatus {
  Active = 0,
  Expired = 1,
  Claimed = 2,
  Discontinued = 3,
}

export interface Policy {
  policyId: number;
  name: string;
  policyholder: string;
  flightNumbers: string[];
  departureTimes: number[];
  premium: string;
  payoutAmount: string;
  payoutToDate: string;
  delayThreshold: number;
  status: PolicyStatus;
  isClaimed: boolean;
  isPaid: boolean;
}

/**
 * Converts raw policy from contract to frontend format
 */
function formatPolicy(raw: any): Policy {
  return {
    policyId: Number(raw.policyId),
    name: `Policy #${Number(raw.policyId)}`,
    policyholder: raw.insured,
    flightNumbers: raw.flightNumbers,
    departureTimes: raw.departureTimes.map((ts: any) => Number(ts)),
    premium: ethers.formatEther(raw.premium),
    payoutAmount: ethers.formatEther(raw.maxPayout),
    payoutToDate: ethers.formatEther(raw.payoutToDate),
    delayThreshold: Number(raw.delayThreshold),
    status: raw.status,
    isClaimed: raw.status === PolicyStatus.Claimed,
    isPaid: !!raw.payoutToDate && BigInt(raw.payoutToDate.toString()) > 0n,
  };
}

export function useFlightInsurance() {
  const { insurerContract, signer, account } = useWeb3();

  /**
   * Fetch available policies (active company-offered policy types).
   */
  async function getAvailablePolicies(): Promise<Policy[]> {
    if (!insurerContract) return [];
    try {
      const rawPolicies = await insurerContract.getCompanyPolicies();
      return rawPolicies.map((p: any, i: number) => ({
        ...formatPolicy(p),
        policyId: i + 1,
      }));
    } catch (error) {
      console.error("Error fetching available policies:", error);
      return [];
    }
  }

  /**
   * Fetch user-owned policies from contract.
   */
  async function getUserPolicies(): Promise<Policy[]> {
    if (!account || !insurerContract) return [];
    try {
      const rawPolicies = await insurerContract.getPolicyOfCustomer(account);
      return rawPolicies.map(formatPolicy);
    } catch (error) {
      console.error("Error fetching user policies:", error);
      return [];
    }
  }

  /**
   * Purchase a new policy.
   */
  async function purchasePolicy(
    policyTypeId: number,
    flightNumber: string,
    departureTime: number,
    premium: string
  ) {
    if (!insurerContract) throw new Error("Insurer contract not initialized");

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

  /**
   * Claim an active policy payout.
   */
  async function claimPolicy(): Promise<string> {
    if (!insurerContract) throw new Error("Insurer contract not initialized");

    try {
      const tx = await insurerContract.claimPolicy();
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error("Error claiming policy:", error);
      throw new Error("Claim transaction failed.");
    }
  }

  return {
    getAvailablePolicies,
    getUserPolicies,
    purchasePolicy,
    claimPolicy,
  };
}
