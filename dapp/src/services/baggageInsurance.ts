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
    payoutIfDelayed: ethers.formatEther(raw.payoutIfDelayed),
    payoutIfLost: ethers.formatEther(raw.payoutIfLost),
    maxTotalPayout: ethers.formatEther(raw.maxTotalPayout),
    coverageDurationDays: Number(raw.coverageDurationDays),
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
      premium: String(raw.template.premium),
      payoutIfDelayed: String(raw.template.payoutIfDelayed),
      payoutIfLost: String(raw.template.payoutIfLost),
      maxTotalPayout: String(raw.template.maxTotalPayout),
      coverageDurationDays: Number(raw.template.coverageDurationDays),
      status: Number(raw.template.status),
    },
    itemDescription: raw.itemDescription,
    createdAt: Number(raw.createdAt),
    payoutToDate: ethers.formatEther(raw.payoutToDate),
    buyer: raw.buyer,
    status: Number(raw.status),
  };
}

export function useBaggageInsurance() {
  const { insurerContract, account } = useWeb3();

  // ====== Insurer Functions ======
  async function createBaggagePolicyTemplate(
    name: string,
    description: string,
    premium: number,
    payoutIfDelayed: number,
    payoutIfLost: number,
    maxTotalPayout: number,
    coverageDurationDays: number
  ): Promise<BaggagePolicyTemplate> {
    const template: BaggagePolicyTemplateCreate = {
      name: name,
      description: description,
      premium: premium.toString(),
      payoutIfDelayed: payoutIfDelayed.toString(),
      payoutIfLost: payoutIfLost.toString(),
      maxTotalPayout: maxTotalPayout.toString(),
      coverageDurationDays: coverageDurationDays,
    };
    const res = await fetch("/api/baggageTemplates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
    payoutIfDelayed: number,
    payoutIfLost: number,
    maxTotalPayout: number,
    coverageDurationDays: number
  ): Promise<BaggagePolicyTemplate> {
    const template: BaggagePolicyTemplateUpdate = {
      name: name,
      description: description,
      premium: premium.toString(),
      payoutIfDelayed: payoutIfDelayed.toString(),
      payoutIfLost: payoutIfLost.toString(),
      maxTotalPayout: maxTotalPayout.toString(),
      coverageDurationDays: coverageDurationDays,
    };
    const res = await fetch(`/api/baggageTemplates/${templateId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(template),
    });
    const templates = await res.json();
    return templates.data;
  }

  async function deactivateBaggagePolicyTemplate(templateId: string): Promise<void> {
    const res = await fetch(`/api/baggageTemplates/${templateId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
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

  async function getAllBaggagePolicies(): Promise<BaggageUserPolicy[]> {
    if (!insurerContract) return [];
    const rawPolicies = await insurerContract.getAllBaggagePolicies();
    return rawPolicies.map(formatUserPolicy);
  }

  // ====== User Functions ======
  async function purchaseBaggagePolicy(template: BaggagePolicyTemplate, itemDescription: string, premium: string): Promise<string> {
    if (!insurerContract) throw new Error("Insurer contract not connected");

    const tx = await insurerContract.purchaseBaggagePolicy(template, itemDescription, {
      value: ethers.parseEther(premium),
    });

    await tx.wait();
    return tx.hash;
  }

  async function getUserBaggagePolicies(userAddress: string): Promise<BaggageUserPolicy[]> {
    if (!insurerContract) return [];
    try {
      const raw = await insurerContract.getUserBaggagePolicies(userAddress);
      return raw.map(formatUserPolicy);
    } catch (error) {
      console.error("Error fetching user baggage policies:", error);
      return [];
    }
  }

  async function getUserBaggagePoliciesByTemplate(templatedId: string): Promise<BaggageUserPolicy[]> {
    if (!insurerContract) return [];
    try {
      const raw = await insurerContract.getUserBaggagePoliciesByTemplate(templatedId);
      return raw.map(formatUserPolicy);
    } catch (error) {
      console.error(`Error fetching user baggage policies for templateId ${templatedId}:`, error);
      return [];
    }
  }

  async function claimBaggagePayout(policyId: number): Promise<void> {
    if (!insurerContract) throw new Error("Insurer contract not connected");

    try {
      const tx = await insurerContract.claiBaggagePayout(policyId);
      await tx.wait();
      console.log(`Baggage policy #${policyId} claimed successfully.`);
    } catch (error) {
      console.error(`Failed to claim baggage policy #${policyId}:`, error);
      throw error;
    }
  }

  async function isBaggagePolicyTemplateAllowedForPurchase(templates: BaggagePolicyTemplate[]): Promise<boolean[]> {
    if (!insurerContract) return [];
    const isAllowed = await insurerContract.isBaggagePolicyAllowedForPurchase(templates);
    return isAllowed;
  }

  async function getActiveBaggagePolicyTemplates(): Promise<BaggagePolicyTemplate[]> {
    const res = await fetch(`/api/baggageTemplates?status=${BaggagePolicyTemplateStatus.Active}`);
    const templates = await res.json();
    return templates.data;
  }

  return {
    createBaggagePolicyTemplate,
    editBaggagePolicyTemplate,
    deactivateBaggagePolicyTemplate,
    getAllBaggagePolicyTemplates,
    getBaggagePolicyTemplateById,
    getAllBaggagePolicies,
    purchaseBaggagePolicy,
    getUserBaggagePolicies,
    getUserBaggagePoliciesByTemplate,
    claimBaggagePayout,
    isBaggagePolicyTemplateAllowedForPurchase,
    getActiveBaggagePolicyTemplates,
  };
}
