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
    coverageDurationDays: Number(raw.coverageDurationDays),
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
      coverageDurationDays: Number(raw.template.coverageDurationDays),
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
    coverageDurationDays: number
  ): Promise<FlightPolicyTemplate> {
    const template: FlightPolicyTemplateCreate = {
      name,
      description,
      premium: premium.toString(),
      payoutPerHour: payoutPerHour.toString(),
      delayThresholdHours,
      maxTotalPayout: maxTotalPayout.toString(),
      coverageDurationDays,
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
    coverageDurationDays: number
  ): Promise<FlightPolicyTemplate> {
    const template: FlightPolicyTemplateUpdate = {
      name,
      description,
      premium: premium.toString(),
      payoutPerHour: payoutPerHour.toString(),
      delayThresholdHours,
      maxTotalPayout: maxTotalPayout.toString(),
      coverageDurationDays,
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

    const tx = await insurerContract.purchaseFlightPolicy(
      template,
      flightNumber,
      departureAirportCode,
      arrivalAirportCode,
      departureTime,
      { value: ethers.parseEther(premium) }
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

  async function getUserFlightPoliciesByTemplate(templatedId: string): Promise<FlightUserPolicy[]> {
    if (!insurerContract) return [];
    try {
      const raw = await insurerContract.getUserFlightPoliciesByTemplate(templatedId);
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
    if (!flightPolicyContract || !signer) {
      throw new Error("Contract or signer not connected");
    }

    // helper to actually call the solidity method
    const doClaim = async () => {
      const user = await signer.getAddress();
      console.log("Before calling claimPayout");
      const tx = await flightPolicyContract.claimPayout(policyId, user, {gasLimit: 200_000});
      console.log("After calling claimPayout", tx);
      await tx.wait();
    };

    // First attempt
    try {
      await doClaim();
      return;
    } catch (err: any) {
      // look in every possible place for the ORACLE_PENDING revert
      const msg =
        err.data?.message ||
        err.error?.message ||
        err.reason ||
        err.message ||
        "";
      console.log("Error claiming flight payout:", msg);
      if (!msg.includes("ORACLE_PENDING")) {
        // some other revert → bubble up
        throw err;
      }
    }

    // Oracle is pending → subscribe to FlightDataReceived, then retry
    const oracleAddr = await flightPolicyContract.oracleConnector();
    const oracle = new ethers.Contract(
      oracleAddr,
      OracleConnectorABI.abi,
      signer
    );

    const depStr = departureTime.toString();
    const filter = oracle.filters.FlightDataReceived(
      null,          // any requestId
      flightNumber,
      depStr,
      null,
      null
    );

    console.log("Waiting for oracle data...");

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        oracle.off(filter, onData);
        reject(new Error("Oracle response timed out"));
      }, 120_000);

      async function onData() {
        clearTimeout(timeout);
        oracle.off(filter, onData);
        await doClaim();    // second attempt should now succeed
        resolve();
      }

      oracle.once(filter, onData);
    });
  }

  // ====== Utility Functions ======
  async function isInsurer(userAddress: string): Promise<boolean> {
    if (!insurerContract) return false;
    return await insurerContract.isInsurer(userAddress);
  }

  async function isFlightPolicyTemplateAllowedForPurchase(templates: FlightPolicyTemplate[]): Promise<boolean[]> {
    if (!insurerContract) return [];
    return await insurerContract.isFlightPolicyAllowedForPurchase(templates);
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
