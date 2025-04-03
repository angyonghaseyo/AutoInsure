import type { NextApiRequest, NextApiResponse } from "next";
import { getPolicyTemplateById, updatePolicyTemplate } from "../../../backend/services/policyTemplateService";

type ResponseData = {
  success: boolean;
  data?: any;
  error?: string;
};

/**
 * API handler for /api/policyTemplates/[templateId]
 * GET: Returns a specific policy by ID
 * PUT: Updates a specific policy
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { method } = req;
  const { templateId } = req.query;

  // Validate ID
  if (!templateId || Array.isArray(templateId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid policy template ID",
    });
  }

  try {
    switch (method) {
      case "GET":
        // Get policy by ID
        const policy = await getPolicyTemplateById(templateId);

        if (!policy) {
          return res.status(404).json({
            success: false,
            error: "Policy Template not found",
          });
        }

        return res.status(200).json({
          success: true,
          data: policy,
        });

      case "PUT":
        // Validate request body
        if (!req.body) {
          return res.status(400).json({
            success: false,
            error: "Request body is required",
          });
        }

        // Prepare update data
        const updateData = {
          ...req.body,
        };

        // Update policy
        const updatedPolicy = await updatePolicyTemplate(templateId, updateData);

        if (!updatedPolicy) {
          return res.status(404).json({
            success: false,
            error: "Policy Template not found",
          });
        }

        return res.status(200).json({
          success: true,
          data: updatedPolicy,
        });

      default:
        return res.status(405).json({
          success: false,
          error: `Method ${method} Not Allowed`,
        });
    }
  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
}
