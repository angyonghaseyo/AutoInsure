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
  const { insurerContract, oracleConnectorContract, baggagePolicyContract } = useWeb3();

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

  async function claimBaggagePayout(policyId: number): Promise<void> {
    if (!insurerContract || !baggagePolicyContract || !oracleConnectorContract) {
      throw new Error("Contracts not connected");
    }
  
    let resolved = false;
  
    const cleanup = () => {
      insurerContract.removeAllListeners("PayoutClaimed");
      baggagePolicyContract.removeAllListeners("PayoutEvaluated");
      oracleConnectorContract.removeAllListeners("BaggageDataRecieved");
    };
  
    const [oracleAddr, baggagePolicyAddr, insurerAddr] = await Promise.all([
      oracleConnectorContract.getAddress(),
      baggagePolicyContract.getAddress(),
      insurerContract.getAddress(),
    ]);
  
    console.log("Connected to contracts:");
    console.log("OracleConnector at", oracleAddr);
    console.log("BaggagePolicy at", baggagePolicyAddr);
    console.log("Insurer at", insurerAddr);
  
    // Listen for payout evaluation
    baggagePolicyContract.on("PayoutEvaluated", (policyIdEmitted, buyer, outcome) => {
      if (resolved || policyIdEmitted.toString() !== policyId.toString()) return;
  
      switch (outcome.toString()) {
        case "0": // Pending
          alert("Payout pending - waiting for oracle data...");
          console.log("Payout pending - waiting for oracle data...");
          break;
        case "2": // No payout due
          alert("No payout: Baggage was not delayed or lost.");
          resolved = true;
          cleanup();
          break;
        case "3": // Success
          console.log("Payout approved. Awaiting transfer...");
          break;
        default:
          console.warn("Unknown payout result:", outcome.toString());
          cleanup();
      }
    });
  
    // Listen for payout claimed
    insurerContract.on("PayoutClaimed", (policyIdEmitted, buyer, amount) => {
      if (resolved || policyIdEmitted.toString() !== policyId.toString()) return;
  
      console.log("PayoutClaimed:", {
        policyId: policyIdEmitted.toString(),
        buyer,
        amount: ethers.formatEther(amount),
      });
  
      resolved = true;
      cleanup();
    });

    // Listen for BaggageDataRecieved event
    oracleConnectorContract.on("BaggageDataRecieved", async () => {
      if (resolved) return;
  
      try {
        const retryTx = await insurerContract.claimBaggagePayout(policyId);
        await retryTx.wait();
        console.log("Retry claimBaggagePayout submitted.");
      } catch (retryErr: any) {
        console.error("Retry failed:", retryErr?.message || retryErr);
      }
    });
  
    try {
      console.log("Sending initial claimBaggagePayout...");
      const tx = await insurerContract.claimBaggagePayout(policyId);
      await tx.wait();
      console.log("Initial claim transaction confirmed.");
    } catch (err: any) {
      cleanup();
      const errorMsg =
        err?.error?.message ||
        err?.reason ||
        err?.data?.message ||
        err?.message ||
        "Initial claim failed";
      throw new Error(errorMsg);
    }
  
    // Safeguard
    setTimeout(() => {
      if (!resolved) {
        cleanup();
        console.warn("Timeout: No final claim result after 2 minutes");
      }
    }, 120_000);
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
    claimBaggagePayout,
    isInsurer,
    isBaggagePolicyTemplateAllowedForPurchase,
  };
}
