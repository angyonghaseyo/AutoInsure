import { FlightPolicyTemplateUpdate, FlightPolicyTemplateCreate, FlightPolicyTemplate, FlightPolicyTemplateStatus } from "../../types/FlightPolicy";
import { findDocuments, findDocumentById, insertDocument, updateDocument } from "../utils/db-helpers";

// Collection name
const COLLECTION = "flightPolicyTemplates";

/**
 * Get all policy templates with optional filtering
 */
export async function getPolicyTemplates(filter: Partial<FlightPolicyTemplate> = {}, limit: number = 100, skip: number = 0): Promise<FlightPolicyTemplate[]> {
  return findDocuments<FlightPolicyTemplate>(COLLECTION, filter, { createdAt: -1 }, limit, skip);
}

/**
 * Get a single policy template by policy ID
 */
export async function getPolicyTemplateById(templateId: string): Promise<FlightPolicyTemplate | null> {
  return findDocumentById<FlightPolicyTemplate>(COLLECTION, templateId, "templateId");
}

/**
 * Create a new policy template
 */
export async function createPolicyTemplate(policy: FlightPolicyTemplateCreate): Promise<FlightPolicyTemplate> {
  return insertDocument<FlightPolicyTemplate>(COLLECTION, policy as FlightPolicyTemplate, FlightPolicyTemplateStatus.Active);
}

/**
 * Update a policy template by template ID
 */
export async function updatePolicyTemplate(templateId: string, update: FlightPolicyTemplateUpdate): Promise<FlightPolicyTemplate | null> {
  return updateDocument<FlightPolicyTemplate>(COLLECTION, templateId, update, "templateId");
}
