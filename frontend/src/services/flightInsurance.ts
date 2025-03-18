import { ethers } from "ethers";
import InsurerABI from "../utils/abis/Insurer.json";
import contractAddresses from "../utils/contractAddresses.json";

export enum PolicyStatus {
  Active = "Active",
  Expired = "Expired",
  Claimed = "Claimed",
  Cancelled = "Cancelled",
}

export interface Policy {
  name: string;
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

export class FlightInsuranceService {
  private contract: ethers.Contract;
  private provider: ethers.BrowserProvider;
  private signer: ethers.Signer;

  constructor(provider: ethers.BrowserProvider, signer: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
    const contractAddress = contractAddresses[1]?.insurer; // Adjust for correct chain ID
    this.contract = new ethers.Contract(contractAddress, InsurerABI.abi, signer);
  }

  /**
   * Fetch available policies from blockchain.
   */
  async getAvailablePolicies(): Promise<Policy[]> {
    try {
      const numPolicies = await this.contract.numPolicyTypes();
      const policies: Policy[] = [];

      for (let i = 1; i <= numPolicies; i++) {
        const policy = await this.contract.getPolicyDetails(i);
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
      console.error("Error fetching available policies:", error);
      return [];
    }
  }

  /**
   * Purchase a policy.
   * @param policyTypeId Policy type ID
   * @param flightNumber Flight number
   * @param departureTime Flight departure time
   * @param premium Premium amount in ETH
   */
  async purchasePolicy(policyTypeId: number, flightNumber: string, departureTime: number, premium: string) {
    try {
      const tx = await this.contract.buyPolicy(policyTypeId, flightNumber, departureTime, {
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
   * Fetch policy owned by a user.
   * @param userAddress Ethereum address of the user
   */
  async getUserPolicy(userAddress: string): Promise<Policy | null> {
    try {
      const policy = await this.contract.getPolicyOfInsured(userAddress);
      return {
        policyId: policy.policyTypeId,
        name: `Policy #${policy.policyTypeId}`,
        flightNumber: policy.flightNumber,
        departureTime: Number(policy.departureTime),
        premium: ethers.formatEther(policy.premium),
        payoutAmount: ethers.formatEther(policy.maxPayout),
        isPaid: false,
        isClaimed: policy.isClaimed,
        delayThreshold: policy.numHoursDelay * 60,
        policyholder: userAddress,
        status: policy.isClaimed ? PolicyStatus.Claimed : PolicyStatus.Active,
      };
    } catch (error) {
      console.error("Error fetching user policy:", error);
      return null;
    }
  }

  /**
   * Claim a policy payout.
   */
  async claimPolicy() {
    try {
      const tx = await this.contract.claimPolicy();
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error("Error claiming policy:", error);
      throw new Error("Claim transaction failed.");
    }
  }
}
