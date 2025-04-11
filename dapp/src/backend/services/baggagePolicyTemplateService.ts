import { BaggagePolicyTemplateCreate, BaggagePolicyTemplate, BaggagePolicyTemplateUpdate, BaggagePolicyTemplateStatus } from "../../types/BaggagePolicy";
import { findDocuments, findDocumentById, insertDocument, updateDocument } from "../utils/db-helpers";

// Collection name
const COLLECTION = "baggagePolicyTemplates";

/**
 * Get all baggage policy templates with optional filtering
 */
export async function getBaggagePolicyTemplates(filter: Partial<BaggagePolicyTemplate> = {}, limit: number = 100, skip: number = 0): Promise<BaggagePolicyTemplate[]> {
  return findDocuments<BaggagePolicyTemplate>(COLLECTION, filter, { createdAt: -1 }, limit, skip);
}

/**
 * Get a single baggage policy template by template ID
 */
export async function getBaggagePolicyTemplateById(templateId: string): Promise<BaggagePolicyTemplate | null> {
  return findDocumentById<BaggagePolicyTemplate>(COLLECTION, templateId, "templateId");
}

/**
 * Create a new baggage policy template
 */
export async function createBaggagePolicyTemplate(policy: BaggagePolicyTemplateCreate): Promise<BaggagePolicyTemplate> {
  return insertDocument<BaggagePolicyTemplate>(COLLECTION, policy as BaggagePolicyTemplate, BaggagePolicyTemplateStatus.Active);
}

/**
 * Update a baggage policy template by template ID
 */
export async function updateBaggagePolicyTemplate(templateId: string, update: BaggagePolicyTemplateUpdate): Promise<BaggagePolicyTemplate | null> {
  return updateDocument<BaggagePolicyTemplate>(COLLECTION, templateId, update, "templateId");
}
