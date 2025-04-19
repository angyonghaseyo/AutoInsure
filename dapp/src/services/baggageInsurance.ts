import { ethers } from "ethers";
import { useWeb3 } from "../components/Web3Provider";
import { BaggagePolicyTemplate, BaggageUserPolicy, BaggagePolicyTemplateCreate, BaggagePolicyTemplateStatus, BaggagePolicyTemplateUpdate } from "@/types/BaggagePolicy";

export function formatPolicyTemplate(raw: any): BaggagePolicyTemplate {
  return {
    templateId: raw.templateId,
    name: raw.name,
    description: raw.description,
    createdAt: Number(raw.createdAt),
    updatedAt: Number(raw.updatedAt),
    premium: ethers.formatEther(raw.premium),
    maxTotalPayout: ethers.formatEther(raw.maxTotalPayout),
    coverageDurationSeconds: Number(raw.template.coverageDurationSeconds),
    status: Number(raw.status),
  };
}

export function formatUserPolicy(raw: any): BaggageUserPolicy {
  return {
    policyId: Number(raw.policyId),
    template: {
      templateId: raw.template.templateId,
      name: raw.template.name,
      description: raw.template.description,
      createdAt: Number(raw.template.createdAt),
      updatedAt: Number(raw.template.updatedAt),
      premium: ethers.formatEther(raw.template.premium),
      maxTotalPayout: ethers.formatEther(raw.template.maxTotalPayout),
      coverageDurationSeconds: Number(raw.template.coverageDurationSeconds),
      status: Number(raw.template.status),
    },
    flightNumber: raw.flightNumber,
    departureTime: Number(raw.departureTime),
    itemDescription: raw.itemDescription,
    createdAt: Number(raw.createdAt),
    payoutToDate: ethers.formatEther(raw.payoutToDate),
    buyer: raw.buyer,
    status: Number(raw.status),
  };
}

export function useBaggageInsurance() {
  const { insurerContract } = useWeb3();

  // ====== Insurer Functions ======
  async function createBaggagePolicyTemplate(
    name: string,
    description: string,
    premium: number,
    maxTotalPayout: number,
    coverageDurationSeconds: number
  ): Promise<BaggagePolicyTemplate> {
    const template: BaggagePolicyTemplateCreate = {
      name: name,
      description: description,
      premium: premium.toString(),
      maxTotalPayout: maxTotalPayout.toString(),
      coverageDurationSeconds: coverageDurationSeconds,
    };
    const res = await fetch("/api/baggageTemplates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    });
    const templates = await res.json();
    return templates.data;
  }

  async function editBaggagePolicyTemplate(
    templateId: string,
    name: string,
    description: string,
    premium: number,
    maxTotalPayout: number,
    coverageDurationSeconds: number
  ): Promise<BaggagePolicyTemplate> {
    const template: BaggagePolicyTemplateUpdate = {
      name: name,
      description: description,
      premium: premium.toString(),
      maxTotalPayout: maxTotalPayout.toString(),
      coverageDurationSeconds: coverageDurationSeconds,
    };
    const res = await fetch(`/api/baggageTemplates/${templateId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    });
    const templates = await res.json();
    return templates.data;
  }

  async function deactivateBaggagePolicyTemplate(templateId: string): Promise<void> {
    const res = await fetch(`/api/baggageTemplates/${templateId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: BaggagePolicyTemplateStatus.Deactivated }),
    });
    const template = await res.json();
    return template.data;
  }

  async function getAllBaggagePolicyTemplates(): Promise<BaggagePolicyTemplate[]> {
    const res = await fetch("/api/baggageTemplates");
    const rawTemplates = await res.json();
    return rawTemplates.data;
  }

  async function getBaggagePolicyTemplateById(templateId: string): Promise<BaggagePolicyTemplate | null> {
    try {
      const res = await fetch(`/api/baggageTemplates/${templateId}`);
      const template = await res.json();
      return template.data;
    } catch (error) {
      console.error(`Error fetching baggage policy template with ID ${templateId}:`, error);
      return null;
    }
  }

  async function getActiveBaggagePolicyTemplates(): Promise<BaggagePolicyTemplate[]> {
    const res = await fetch(`/api/baggageTemplates?status=${BaggagePolicyTemplateStatus.Active}`);
    const templates = await res.json();
    return templates.data;
  }

  async function getAllBaggagePolicies(): Promise<BaggageUserPolicy[]> {
    if (!insurerContract) return [];
    const rawPolicies = await insurerContract.getAllBaggagePolicies(Math.floor(Date.now() / 1000));
    return rawPolicies.map(formatUserPolicy);
  }

  async function getUserBaggagePoliciesByTemplate(templatedId: string): Promise<BaggageUserPolicy[]> {
    if (!insurerContract) return [];
    try {
      const raw = await insurerContract.getUserBaggagePoliciesByTemplate(templatedId, Math.floor(Date.now() / 1000));
      return raw.map(formatUserPolicy);
    } catch (error) {
      console.error(`Error fetching user baggage policies for templateId ${templatedId}:`, error);
      return [];
    }
  }

  // ====== User Functions ======
  async function purchaseBaggagePolicy(template: BaggagePolicyTemplate, flightNumber: string, departureTime: number, itemDescription: string, premium: string): Promise<string> {
    if (!insurerContract) throw new Error("Insurer contract not connected");
    const clonedTemplate = { ...template };
    const tx = await insurerContract.purchaseBaggagePolicy(
      convertEtherToWei([clonedTemplate])[0], 
      flightNumber,
      departureTime,
      itemDescription, 
      Math.floor(Date.now() / 1000), 
      {
        value: ethers.parseEther(premium)
      }
    );
    await tx.wait();
    return tx.hash;
  }

  async function getUserBaggagePolicies(userAddress: string): Promise<BaggageUserPolicy[]> {
    if (!insurerContract) return [];
    try {
      const raw = await insurerContract.getUserBaggagePolicies(userAddress, Math.floor(Date.now() / 1000));
      return raw.map(formatUserPolicy);
    } catch (error) {
      console.error("Error fetching user baggage policies:", error);
      return [];
    }
  }

  // ====== Utility Functions ======
  async function isInsurer(userAddress: string): Promise<boolean> {
    if (!insurerContract) return false;
    return await insurerContract.isInsurer(userAddress);
  }

  async function isBaggagePolicyTemplateAllowedForPurchase(templates: BaggagePolicyTemplate[]): Promise<boolean[]> {
    if (!insurerContract) return [];
    const clonedTemplates = templates.map((template) => ({ ...template }));
    const isAllowed = await insurerContract.isBaggagePolicyTemplateAllowedForPurchase(convertEtherToWei(clonedTemplates), Math.floor(Date.now() / 1000));
    return isAllowed;
  }

  // ====== Helper Functions ======
  function convertEtherToWei(templates: BaggagePolicyTemplate[]): BaggagePolicyTemplate[] {
    for (const template of templates) {
      template.premium = String(ethers.parseEther(template.premium));
      template.maxTotalPayout = String(ethers.parseEther(template.maxTotalPayout));
    }
    return templates;
  }

  return {
    createBaggagePolicyTemplate,
    editBaggagePolicyTemplate,
    deactivateBaggagePolicyTemplate,
    getAllBaggagePolicyTemplates,
    getBaggagePolicyTemplateById,
    getActiveBaggagePolicyTemplates,
    getAllBaggagePolicies,
    getUserBaggagePoliciesByTemplate,
    purchaseBaggagePolicy,
    getUserBaggagePolicies,
    
    isInsurer,
    isBaggagePolicyTemplateAllowedForPurchase,
  };
}
