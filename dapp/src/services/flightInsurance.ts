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
  async function claimFlightPayout(policyId: number, flightNumber: string, departureTime: number): Promise<void> {
    if (!insurerContract || !signer || !flightPolicyContract) {
      throw new Error("Contract or signer not connected");
    }
  
    const oracleAddr = await flightPolicyContract.oracleConnector();
    const oracle = new ethers.Contract(oracleAddr, OracleConnectorABI.abi, signer);
    const filter = oracle.filters.FlightDataReceived();
  
    // Helper to try claim
    const attemptClaim = async (): Promise<boolean> => {
      try {
        const tx = await insurerContract.claimFlightPayout(policyId);
        const receipt = await tx.wait();
    
        // Parse return value from logs
        const result = await insurerContract.provider.call(
          insurerContract.claimFlightPayout(policyId), // static call for return value
          tx.blockNumber
        );
    
        const success = ethers.AbiCoder.defaultAbiCoder().decode(["bool"], result)[0];
        return success;
      } catch (err: any) {
        const message =
          err?.error?.message ||
          err?.reason ||
          err?.data?.message ||
          err?.message ||
          "";
    
        if (message.includes("Flight not delayed") || message.includes("Policy not active")) {
          throw new Error(message);
        }
    
        return false; // treat all other issues as retryable
      }
    };
  
    console.log("🕒 Attempting to claim flight payout...");
    const firstAttempt = await attemptClaim();
  
    if (firstAttempt) {
      console.log("✅ Claim succeeded on first attempt");
      return;
    }
  
    console.log("📡 Oracle data not ready. Listening for FlightDataReceived...");
  
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        oracle.off(filter, onEvent);
        reject(new Error("❌ Oracle did not respond in time (2 minutes)"));
      }, 120_000);
  
      async function onEvent() {
        if (!insurerContract) {
          clearTimeout(timeout);
          reject(new Error("Insurer contract not connected"));
          return;
        }
  
        clearTimeout(timeout);
        oracle.off(filter, onEvent);
        console.log("📬 Oracle data received. Retrying claim...");
  
        try {
          insurerContract
            .claimFlightPayout(policyId)
            .then(tx => tx.wait())
            .then(() => {
              console.log("✅ Claim succeeded on retry");
              resolve();
            })
            .catch((retryErr: any) => {
              const msg =
                retryErr?.error?.message ||
                retryErr?.message ||
                "Claim failed after retry";
              reject(new Error(msg));
            });
        } catch (retryCatchErr: any) {
          reject(
            new Error(retryCatchErr?.message || "Unexpected error during retry")
          );
        }
      }
  
      oracle.once(filter, onEvent);
    });
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
