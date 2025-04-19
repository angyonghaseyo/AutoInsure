import { ethers } from "ethers";
import { useWeb3 } from "../components/Web3Provider";
import { FlightPolicyTemplate, FlightPolicyTemplateStatus, FlightUserPolicy, FlightPolicyTemplateCreate, FlightPolicyTemplateUpdate } from "../types/FlightPolicy";

export function formatPolicyTemplate(raw: any): FlightPolicyTemplate {
  return {
    templateId: raw.templateId,
    name: raw.name,
    description: raw.description,
    createdAt: Number(raw.createdAt),
    updatedAt: Number(raw.updatedAt),
    premium: ethers.formatEther(raw.premium),
    payoutPerHour: ethers.formatEther(raw.payoutPerHour),
    maxTotalPayout: ethers.formatEther(raw.maxTotalPayout),
    delayThresholdHours: Number(raw.delayThresholdHours),
    coverageDurationSeconds: Number(raw.coverageDurationSeconds),
    status: Number(raw.status),
  };
}

export function formatUserPolicy(raw: any): FlightUserPolicy {
  return {
    policyId: Number(raw.policyId),
    template: {
      templateId: raw.template.templateId,
      name: raw.template.name,
      description: raw.template.description,
      createdAt: Number(raw.template.createdAt),
      updatedAt: Number(raw.template.updatedAt),
      premium: ethers.formatEther(raw.template.premium),
      payoutPerHour: ethers.formatEther(raw.template.payoutPerHour),
      maxTotalPayout: ethers.formatEther(raw.template.maxTotalPayout),
      delayThresholdHours: Number(raw.template.delayThresholdHours),
      coverageDurationSeconds: Number(raw.template.coverageDurationSeconds),
      status: Number(raw.template.status),
    },
    flightNumber: raw.flightNumber,
    departureTime: Number(raw.departureTime),
    createdAt: Number(raw.createdAt),
    payoutToDate: ethers.formatEther(raw.payoutToDate),
    buyer: raw.buyer,
    status: Number(raw.status),
  };
}

export function useFlightInsurance() {
  const { insurerContract, flightPolicyContract, oracleConnectorContract } = useWeb3();

  // ====== Insurer Functions ======
  async function createFlightPolicyTemplate(
    name: string,
    description: string,
    premium: number,
    payoutPerHour: number,
    maxTotalPayout: number,
    delayThresholdHours: number,
    coverageDurationSeconds: number
  ): Promise<FlightPolicyTemplate> {
    const template: FlightPolicyTemplateCreate = {
      name,
      description,
      premium: premium.toString(),
      payoutPerHour: payoutPerHour.toString(),
      maxTotalPayout: maxTotalPayout.toString(),
      delayThresholdHours,
      coverageDurationSeconds: coverageDurationSeconds,
    };

    const res = await fetch("/api/flightTemplates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    });
    const templates = await res.json();
    return templates.data;
  }

  async function editFlightPolicyTemplate(
    templateId: string,
    name: string,
    description: string,
    premium: number,
    payoutPerHour: number,
    maxTotalPayout: number,
    delayThresholdHours: number,
    coverageDurationSeconds: number
  ): Promise<FlightPolicyTemplate> {
    const template: FlightPolicyTemplateUpdate = {
      name,
      description,
      premium: premium.toString(),
      payoutPerHour: payoutPerHour.toString(),
      maxTotalPayout: maxTotalPayout.toString(),
      delayThresholdHours,
      coverageDurationSeconds: coverageDurationSeconds,
    };

    const res = await fetch(`/api/flightTemplates/${templateId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    });
    const templates = await res.json();
    return templates.data;
  }

  async function deactivateFlightPolicyTemplate(templateId: string): Promise<void> {
    await fetch(`/api/flightTemplates/${templateId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: FlightPolicyTemplateStatus.Deactivated }),
    });
  }

  async function getAllFlightPolicyTemplates(): Promise<FlightPolicyTemplate[]> {
    const res = await fetch("/api/flightTemplates");
    const rawTemplates = await res.json();
    return rawTemplates.data;
  }

  async function getFlightPolicyTemplateById(templateId: string): Promise<FlightPolicyTemplate | null> {
    try {
      const res = await fetch(`/api/flightTemplates/${templateId}`);
      const template = await res.json();
      return template.data;
    } catch (error) {
      console.error(`Error fetching flight policy template with ID ${templateId}:`, error);
      return null;
    }
  }

  async function getActiveFlightPolicyTemplates(): Promise<FlightPolicyTemplate[]> {
    const res = await fetch(`/api/flightTemplates?status=${FlightPolicyTemplateStatus.Active}`);
    const templates = await res.json();
    return templates.data;
  }

  async function getAllFlightPolicies(): Promise<FlightUserPolicy[]> {
    if (!insurerContract) return [];
    const rawPolicies = await insurerContract.getAllFlightPolicies(Math.floor(Date.now() / 1000));
    return rawPolicies.map(formatUserPolicy);
  }

  async function getUserFlightPoliciesByTemplate(templatedId: string): Promise<FlightUserPolicy[]> {
    if (!insurerContract) return [];
    try {
      const raw = await insurerContract.getUserFlightPoliciesByTemplate(templatedId, Math.floor(Date.now() / 1000));
      return raw.map(formatUserPolicy);
    } catch (error) {
      console.error(`Error fetching user flight policies for templateId ${templatedId}:`, error);
      return [];
    }
  }

  // ====== User Functions ======
  async function purchaseFlightPolicy(template: FlightPolicyTemplate, flightNumber: string, departureTime: number, premium: string): Promise<string> {
    if (!insurerContract) throw new Error("Insurer contract not connected");
    const clonedTemplate = { ...template };
    const tx = await insurerContract.purchaseFlightPolicy(
      convertEtherToWei([clonedTemplate])[0],
      flightNumber,
      departureTime,
      Math.floor(Date.now() / 1000),
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
      const raw = await insurerContract.getUserFlightPolicies(userAddress, Math.floor(Date.now() / 1000));
      return raw.map(formatUserPolicy);
    } catch (error) {
      console.error("Error fetching user flight policies:", error);
      return [];
    }
  }
  
  async function claimFlightPayout(policyId: number): Promise<void> {
    if (!insurerContract || !flightPolicyContract || !oracleConnectorContract) {
      throw new Error("Contracts not connected");
    }

    let resolved = false;

    // Cleanup helper
    const cleanup = () => {
      insurerContract.removeAllListeners("PayoutClaimed");
      flightPolicyContract.removeAllListeners("PayoutEvaluated");
      oracleConnectorContract.removeAllListeners("FlightDataReceived");
    };

    const [oracleAddr, flightPolicyAddr, insurerAddr] = await Promise.all([
      oracleConnectorContract.getAddress(),
      flightPolicyContract.getAddress(),
      insurerContract.getAddress(),
    ]);
  
    console.log("Connected to contracts:");
    console.log("OracleConnector at", oracleAddr);
    console.log("FlightPolicy at", flightPolicyAddr);
    console.log("Insurer at", insurerAddr);

    


    // Listen for final payout result
    flightPolicyContract.on("PayoutEvaluated", async (policyIdEmitted, buyer, outcome) => {
      if (resolved || policyIdEmitted.toString() !== policyId.toString()) return;
  
      switch (outcome.toString()) {
        case "0": // Pending
          alert("Payout pending - waiting for oracle data...");
          console.log("Payout pending - waiting for oracle data...");
          break;
        case "1": // Not delayed
          alert("No payout: Flight was not delayed.");
          resolved = true;
          cleanup();
          break;
        case "2": // No payout due
          alert("No payout: Delay not enough for payout.");
          resolved = true;
          cleanup();
          break;
        case "3": // Approved
          console.log("Payout approved. Awaiting transfer...");
          break;
        default:
          console.warn("Unknown payout result:", outcome.toString());
          cleanup();
      }
    });

    // Listen for PayoutClaimed event
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

    // Listen for FlightDataReceived event
    oracleConnectorContract.on("FlightDataReceived", async () => {
      if (resolved) return;
  
      try {
        const retryTx = await insurerContract.claimFlightPayout(policyId);
        await retryTx.wait();
        console.log("Retry claimFlightPayout submitted.");
      } catch (retryErr: any) {
        console.error("Retry failed:", retryErr?.message || retryErr);
      }
    });

    try {
      console.log("Sending initial claimFlightPayout...");
      const tx = await insurerContract.claimFlightPayout(policyId);
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

  async function isFlightPolicyTemplateAllowedForPurchase(templates: FlightPolicyTemplate[]): Promise<boolean[]> {
    if (!insurerContract) return [];
    const clonedTemplates = templates.map((template) => ({ ...template }));
    return await insurerContract.isFlightPolicyTemplateAllowedForPurchase(convertEtherToWei(clonedTemplates), Math.floor(Date.now() / 1000));
  }

  // ====== Helper Functions ======
  function convertEtherToWei(templates: FlightPolicyTemplate[]): FlightPolicyTemplate[] {
    for (const template of templates) {
      template.premium = String(ethers.parseEther(template.premium));
      template.payoutPerHour = String(ethers.parseEther(template.payoutPerHour));
      template.maxTotalPayout = String(ethers.parseEther(template.maxTotalPayout));
    }
    return templates;
  }

  return {
    createFlightPolicyTemplate,
    editFlightPolicyTemplate,
    deactivateFlightPolicyTemplate,
    getAllFlightPolicyTemplates,
    getFlightPolicyTemplateById,
    getActiveFlightPolicyTemplates,
    getAllFlightPolicies,
    getUserFlightPoliciesByTemplate,
    purchaseFlightPolicy,
    getUserFlightPolicies,
    claimFlightPayout,
    isInsurer,
    isFlightPolicyTemplateAllowedForPurchase,
  };
}
