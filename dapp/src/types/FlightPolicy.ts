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
  updatedAt: number;
  premium: string;
  payoutPerHour: string;
  delayThresholdHours: number;
  maxTotalPayout: string;
  coverageDurationDays: number;
  status: FlightPolicyTemplateStatus;
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
export type FlightPolicyTemplateUpdate = Partial<FlightPolicyTemplate>;

/**
 * Policy create interface with required fields
 */
export type FlightPolicyTemplateCreate = Omit<FlightPolicyTemplate, "templateId" | "createdAt" | "updatedAt" | "status">;
