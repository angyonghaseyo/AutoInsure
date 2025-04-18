import { ethers } from "ethers";
import { useWeb3 } from "../components/Web3Provider";
import OracleConnectorABI from "@/utils/abis/OracleConnector.json";
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
    delayThresholdHours: Number(raw.delayThresholdHours),
    maxTotalPayout: ethers.formatEther(raw.maxTotalPayout),
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
      premium: String(raw.template.premium),
      payoutPerHour: String(raw.template.payoutPerHour),
      delayThresholdHours: Number(raw.template.delayThresholdHours),
      maxTotalPayout: String(raw.template.maxTotalPayout),
      coverageDurationSeconds: Number(raw.template.coverageDurationSeconds),
      status: Number(raw.template.status),
    },
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
  const { insurerContract, signer, flightPolicyContract } = useWeb3();

  // ====== Insurer Functions ======
  async function createFlightPolicyTemplate(
    name: string,
    description: string,
    premium: number,
    payoutPerHour: number,
    delayThresholdHours: number,
    maxTotalPayout: number,
    coverageDurationSeconds: number
  ): Promise<FlightPolicyTemplate> {
    const template: FlightPolicyTemplateCreate = {
      name,
      description,
      premium: premium.toString(),
      payoutPerHour: payoutPerHour.toString(),
      delayThresholdHours,
      maxTotalPayout: maxTotalPayout.toString(),
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
    delayThresholdHours: number,
    maxTotalPayout: number,
    coverageDurationSeconds: number
  ): Promise<FlightPolicyTemplate> {
    const template: FlightPolicyTemplateUpdate = {
      name,
      description,
      premium: premium.toString(),
      payoutPerHour: payoutPerHour.toString(),
      delayThresholdHours,
      maxTotalPayout: maxTotalPayout.toString(),
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

    const tx = await insurerContract.purchaseFlightPolicy(template, flightNumber, departureAirportCode, arrivalAirportCode, departureTime, Math.floor(Date.now() / 1000), {
      value: ethers.parseEther(premium),
    });
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

  /**
   * Claim a flight‑delay payout, retrying once the oracle data arrives.
   */
  async function claimFlightPayout(policyId: number): Promise<void> {
    if (!insurerContract || !signer || !flightPolicyContract) {
      throw new Error("Contract or signer not connected");
    }
  
    const oracleAddr = await flightPolicyContract.oracleConnector();
    const oracle = new ethers.Contract(oracleAddr, OracleConnectorABI.abi, signer);
  
    const flightPolicyAddr = flightPolicyContract.target?.toString() || await flightPolicyContract.getAddress();
    const flightPolicy = new ethers.Contract(flightPolicyAddr, flightPolicyContract.interface, signer);
  
    let resolved = false;
  
    console.log("🔌 Connected to contracts:");
    console.log("📡 OracleConnector at", oracleAddr);
    console.log("📑 FlightPolicy at", flightPolicyAddr);
  
    // 🎯 Listen for final success
    flightPolicy.on("PayoutClaimed", (policyIdEmitted, buyer, amount, event) => {
      if (resolved) return;
      resolved = true;
      console.log("✅ PayoutClaimed received:", { policyId: policyIdEmitted.toString(), buyer, amount: ethers.formatEther(amount) });
      cleanup();
    });
  
    // ⏳ Listen for pending status
    flightPolicy.on("PayoutPending", (policyIdEmitted, buyer, event) => {
      console.log("🕓 PayoutPending received. Waiting for oracle data...");
    });
  
    // 📡 Listen for oracle data arriving
    oracle.on("FlightDataReceived", async (requestId, flightNumber, departureTime, isDelayed, delayMinutes, event) => {
      if (resolved) return;
      console.log("📬 FlightDataReceived received from oracle");
      try {
        const retryTx = await insurerContract.claimFlightPayout(policyId);
        // checkFlightStatus (flightNumber, departureTime)
        await retryTx.wait();
        console.log("🔁 Retried claimFlightPayout sent");
      } catch (retryErr: any) {
        const msg = retryErr?.error?.message || retryErr?.message || "Retry failed";
        console.error("❌ Retry failed:", msg);
      }
    });
  
    // ⛳ Clean up all listeners
    function cleanup() {
      flightPolicy.removeAllListeners("PayoutClaimed");
      flightPolicy.removeAllListeners("PayoutPending");
      oracle.removeAllListeners("FlightDataReceived");
    }
  
    try {
      console.log("🚀 Sending initial claimFlightPayout...");
      const tx = await insurerContract.claimFlightPayout(policyId);
      await tx.wait();
    } catch (err: any) {
      cleanup();
      const message =
        err?.error?.message ||
        err?.reason ||
        err?.data?.message ||
        err?.message ||
        "Initial claim attempt failed";
      throw new Error(`❌ ${message}`);
    }
  
    // Optional: timeout safeguard
    setTimeout(() => {
      if (!resolved) {
        cleanup();
        console.warn("⏱️ Timeout: No final claim result after 2 minutes");
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
    return await insurerContract.isFlightPolicyAllowedForPurchase(templates, Math.floor(Date.now() / 1000));
  }

  return {
    createFlightPolicyTemplate,
    editFlightPolicyTemplate,
    deactivateFlightPolicyTemplate,
    getAllFlightPolicyTemplates,
    getFlightPolicyTemplateById,
    getActiveFlightPolicyTemplates,
    getAllFlightPolicies,
    purchaseFlightPolicy,
    getUserFlightPolicies,
    getUserFlightPoliciesByTemplate,
    claimFlightPayout,
    isInsurer,
    isFlightPolicyTemplateAllowedForPurchase,
  };
}
