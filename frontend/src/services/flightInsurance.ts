import { ethers } from "ethers";
import { useWeb3 } from "../components/Web3Provider";

export enum FlightPolicyTemplateStatus {
  Active = 0,
  Deactivated = 1,
}

export enum FlightPolicyStatus {
  Active = 0,
  Expired = 1,
  Claimed = 2,
}

export interface FlightPolicyTemplate {
  templateId: number;
  name: string;
  description: string;
  createdAt: number;
  premium: string;
  payoutPerHour: string;
  delayThresholdHours: number;
  maxTotalPayout: string;
  coverageDurationDays: number;
  status: FlightPolicyTemplateStatus;
}

export interface FlightUserPolicy {
  policyId: number;
  templateId: number;
  flightNumber: string;
  departureAirportCode: string;
  arrivalAirportCode: string;
  departureTime: number;
  createdAt: number;
  payoutToDate: string;
  buyer: string;
  status: FlightPolicyStatus;
}

export function formatPolicyTemplate(raw: any): FlightPolicyTemplate {
  return {
    templateId: Number(raw.templateId),
    name: raw.name,
    description: raw.description,
    createdAt: Number(raw.createdAt),
    premium: ethers.formatEther(raw.premium),
    payoutPerHour: ethers.formatEther(raw.payoutPerHour),
    delayThresholdHours: Number(raw.delayThresholdHours),
    maxTotalPayout: ethers.formatEther(raw.maxTotalPayout),
    coverageDurationDays: Number(raw.coverageDurationDays),
    status: Number(raw.status),
  };
}

export function formatUserPolicy(raw: any): FlightUserPolicy {
  return {
    policyId: Number(raw.policyId),
    templateId: Number(raw.templateId),
    flightNumber: raw.flightNumber,
    departureAirportCode: raw.departureAirportCode,
    arrivalAirportCode: raw.arrivalAirportCode,
    departureTime: Number(raw.departureTime),
    createdAt: Number(raw.createdAt),
    payoutToDate: ethers.formatEther(raw.payoutToDate),
    buyer: raw.buyer,
    status: Number(raw.status),
  };
}

export function useFlightInsurance() {
  const { insurerContract, account } = useWeb3();

  // ====== Insurer Functions ======
  async function createFlightPolicyTemplate(name: string, description: string, premium: number, payoutPerHour: number, delayThresholdHours: number, maxTotalPayout: number, coverageDurationDays: number): Promise<void> {
    if (!insurerContract) throw new Error("Insurer contract not connected");

    const tx = await insurerContract.createFlightPolicyTemplate(
      name,
      description,
      premium,
      payoutPerHour,
      maxTotalPayout,
      delayThresholdHours,
      coverageDurationDays
    );
    await tx.wait();
  }

  async function deactivateFlightPolicyTemplate(templateId: number): Promise<void> {
    if (!insurerContract) throw new Error("Insurer contract not connected");

    const tx = await insurerContract.deactivateFlightPolicyTemplate(templateId);
    await tx.wait();
  }

  async function getAllFlightPolicyTemplates(): Promise<FlightPolicyTemplate[]> {
    if (!insurerContract) return [];
    const rawTemplates = await insurerContract.getAllFlightPolicyTemplates();
    return rawTemplates.map(formatPolicyTemplate);
  }

  async function getFlightPolicyTemplateById(templateId: number): Promise<FlightPolicyTemplate | null> {
    if (!insurerContract) return null;
    try {
      const raw = await insurerContract.getFlightPolicyTemplateById(templateId);
      return formatPolicyTemplate(raw);
    } catch (error) {
      console.error(`Error fetching flight policy template with ID ${templateId}:`, error);
      return null;
    }
  }

  // ====== User Functions ======
  async function purchaseFlightPolicy(templateId: number, flightNumber: string, departureAirportCode: string, arrivalAirportCode: string, departureTime: number, premium: string): Promise<string> {
    if (!insurerContract) throw new Error("Insurer contract not connected");

    const tx = await insurerContract.purchaseFlightPolicy(
      templateId,
      flightNumber,
      departureAirportCode,
      arrivalAirportCode,
      departureTime,
      {
        value: ethers.parseEther(premium),
      }
    );
    await tx.wait();
    return tx.hash;
  }

  async function getUserFlightPolicies(userAddress: string): Promise<FlightUserPolicy[]> {
    if (!insurerContract) return [];
    try {
      const raw = await insurerContract.getUserFlightPolicies(userAddress);
      return raw.map(formatUserPolicy);
    } catch (error) {
      console.error("Error fetching user flight policies:", error);
      return [];
    }
  }

  async function getFlightPolicyWithTemplate(userAddress: string, policyId: number): Promise<{ userPolicy: FlightUserPolicy; template: FlightPolicyTemplate } | null> {
    if (!insurerContract) return null;
    try {
      const [rawPolicy, rawTemplate] = await insurerContract.getFlightPolicyWithTemplate(userAddress, policyId);
      return {
        userPolicy: formatUserPolicy(rawPolicy),
        template: formatPolicyTemplate(rawTemplate),
      };
    } catch (error) {
      console.error("Error fetching flight policy with template:", error);
      return null;
    }
  }

  async function getActiveFlightPolicyTemplates(): Promise<FlightPolicyTemplate[]> {
    if (!insurerContract) return [];
    const rawTemplates = await insurerContract.getActiveFlightPolicyTemplates();
    return rawTemplates.map(formatPolicyTemplate);
  }

  // ====== Utility Functions ======
  async function isInsurer(userAddress: string): Promise<boolean> {
    if (!insurerContract) return false;
    return await insurerContract.isInsurer(userAddress);
  }

  return {
    createFlightPolicyTemplate,
    deactivateFlightPolicyTemplate,
    getAllFlightPolicyTemplates,
    getFlightPolicyTemplateById,
    purchaseFlightPolicy,
    getUserFlightPolicies,
    getFlightPolicyWithTemplate,
    getActiveFlightPolicyTemplates,
    isInsurer,
  };
}
