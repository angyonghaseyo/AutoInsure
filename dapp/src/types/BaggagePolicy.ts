export enum BaggagePolicyTemplateStatus {
  Active = 0,
  Deactivated = 1,
}

export enum BaggagePolicyStatus {
  Active = 0,
  Expired = 1,
  Claimed = 2,
}

export interface BaggagePolicyTemplate {
  templateId: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  premium: string;
  payoutIfDelayed: string;
  payoutIfLost: string;
  maxTotalPayout: string;
  coverageDurationSeconds: number;
  status: BaggagePolicyTemplateStatus;
}

export interface BaggageUserPolicy {
  policyId: number;
  template: BaggagePolicyTemplate;
  itemDescription: string;
  createdAt: number;
  payoutToDate: string;
  buyer: string;
  status: BaggagePolicyStatus;
}

/**
 * Partial policy interface for updates
 */
export type BaggagePolicyTemplateUpdate = Partial<BaggagePolicyTemplate>;

/**
 * Policy create interface with required fields
 */
export type BaggagePolicyTemplateCreate = Omit<BaggagePolicyTemplate, "createdAt" | "updatedAt" | "templateId" | "status">;
