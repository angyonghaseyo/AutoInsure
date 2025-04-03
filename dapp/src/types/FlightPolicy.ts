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
  templateId: string;
  name: string;
  description: string;
  createdAt: number;
  premium: string;
  payoutPerHour: string;
  delayThresholdHours: number;
  maxTotalPayout: string;
  coverageDurationDays: number;
  status: FlightPolicyTemplateStatus;

  updatedAt: number;
}

export interface FlightUserPolicy {
  policyId: number;
  template: FlightPolicyTemplate;
  flightNumber: string;
  departureAirportCode: string;
  arrivalAirportCode: string;
  departureTime: number;
  createdAt: number;
  payoutToDate: string;
  buyer: string;
  status: FlightPolicyStatus;
}

/**
 * Partial policy interface for updates
 */
export type PolicyTemplateUpdate = Partial<FlightPolicyTemplate>;

/**
 * Policy create interface with required fields
 */
export type PolicyTemplateCreate = Omit<FlightPolicyTemplate, "createdAt" | "updatedAt" | "templateId" | "status">;
