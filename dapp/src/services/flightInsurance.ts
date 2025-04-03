import { ethers } from "ethers";
import { useWeb3 } from "../components/Web3Provider";
import { FlightPolicyTemplate, FlightPolicyTemplateStatus, FlightUserPolicy, PolicyTemplateCreate } from "@/types/FlightPolicy";

export function formatPolicyTemplate(raw: any): FlightPolicyTemplate {
  return {
    templateId: raw.templateId,
    name: raw.name,
    description: raw.description,
    createdAt: Number(raw.createdAt),
    premium: ethers.formatEther(raw.premium),
    payoutPerHour: ethers.formatEther(raw.payoutPerHour),
    delayThresholdHours: Number(raw.delayThresholdHours),
    maxTotalPayout: ethers.formatEther(raw.maxTotalPayout),
    coverageDurationDays: Number(raw.coverageDurationDays),
    status: Number(raw.status),
    updatedAt: Number(raw.updatedAt),
  };
}

export function formatUserPolicy(raw: any): FlightUserPolicy {
  return {
    policyId: Number(raw.policyId),
    template: raw.template,
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
  async function createFlightPolicyTemplate(
    name: string,
    description: string,
    premium: number,
    payoutPerHour: number,
    delayThresholdHours: number,
    maxTotalPayout: number,
    coverageDurationDays: number
  ): Promise<FlightPolicyTemplate> {
    const template: PolicyTemplateCreate = {
      name: name,
      description: description,
      premium: premium.toString(),
      payoutPerHour: payoutPerHour.toString(),
      delayThresholdHours: delayThresholdHours,
      maxTotalPayout: maxTotalPayout.toString(),
      coverageDurationDays: coverageDurationDays,
    };
    const res = await fetch("/api/policyTemplates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(template),
    });
    const templates = await res.json();
    return templates.data;
  }

  async function deactivateFlightPolicyTemplate(templateId: string): Promise<void> {
    const res = await fetch(`/api/policyTemplates/${templateId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: FlightPolicyTemplateStatus.Deactivated }),
    });
    const template = await res.json();
    return template.data;
  }

  async function getAllFlightPolicyTemplates(): Promise<FlightPolicyTemplate[]> {
    const res = await fetch("/api/policyTemplates");
    const rawTemplates = await res.json();
    return rawTemplates.data;
  }

  async function getFlightPolicyTemplateById(templateId: string): Promise<FlightPolicyTemplate | null> {
    try {
      const res = await fetch(`/api/policyTemplates/${templateId}`);
      const template = await res.json();
      return template.data;
    } catch (error) {
      console.error(`Error fetching flight policy template with ID ${templateId}:`, error);
      return null;
    }
  }

  async function getUserPoliciesByTemplate(templatedId: string): Promise<FlightUserPolicy[]> {
    if (!insurerContract) return [];
    try {
      const raw = await insurerContract.getUserPoliciesByTemplate(templatedId);
      return raw.map(formatUserPolicy);
    } catch (error) {
      console.error(`Error fetching user flight policies for templateId ${templatedId}:`, error);
      return [];
    }
  }

  async function getAllFlightPolicies(): Promise<FlightUserPolicy[]> {
    if (!insurerContract) return [];
    const rawPolicies = await insurerContract.getAllFlightPolicies();
    return rawPolicies.map(formatUserPolicy);
  }

  // ====== User Functions ======
  async function purchaseFlightPolicy(
    template: FlightPolicyTemplate,
    flightNumber: string,
    departureAirportCode: string,
    arrivalAirportCode: string,
    departureTime: number,
    premium: string
  ): Promise<string> {
    if (!insurerContract) throw new Error("Insurer contract not connected");
    console.log("Purchasing flight policy:", { templateId: template.templateId, flightNumber, departureAirportCode, arrivalAirportCode, departureTime, premium });
    console.log(account);

    const tx = await insurerContract.purchaseFlightPolicy(template, flightNumber, departureAirportCode, arrivalAirportCode, departureTime, {
      value: ethers.parseEther(premium),
    });

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
    const res = await fetch(`/api/policyTemplates?status=${FlightPolicyTemplateStatus.Active}`);
    const templates = await res.json();
    return templates.data;
  }

  async function claimFlightPayout(policyId: number): Promise<void> {
    if (!insurerContract) throw new Error("Insurer contract not connected");

    try {
      const tx = await insurerContract.claimFlightPayout(policyId);
      await tx.wait();
      console.log(`Flight policy #${policyId} claimed successfully.`);
    } catch (error) {
      console.error(`Failed to claim flight policy #${policyId}:`, error);
      throw error;
    }
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
    getAllFlightPolicies,
    getUserPoliciesByTemplate,
    purchaseFlightPolicy,
    getUserFlightPolicies,
    getFlightPolicyWithTemplate,
    getActiveFlightPolicyTemplates,
    claimFlightPayout,
    isInsurer,
  };
}
