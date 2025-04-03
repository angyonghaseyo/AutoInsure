import type { NextApiRequest, NextApiResponse } from "next";
import { createPolicyTemplate, getPolicyTemplates } from "../../../backend/services/policyTemplateService";

type ResponseData = {
  success: boolean;
  data?: any;
  error?: string;
};

/**
 * API handler for /api/policies
 * GET: Returns a list of policies with optional pagination
 * POST: Creates a new policy
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { method } = req;

  try {
    switch (method) {
      case "GET": {
        const { limit = "100", skip = "0", status } = req.query;

        const filter: Record<string, any> = {};
        if (status) filter.status = Number(status);

        const policies = await getPolicyTemplates(filter, Number(limit), Number(skip));
        return res.status(200).json({
          success: true,
          data: policies,
        });
      }

      case "POST": {
        if (!req.body) {
          return res.status(400).json({
            success: false,
            error: "Request body is required",
          });
        }

        const newPolicy = await createPolicyTemplate(req.body);

        return res.status(201).json({
          success: true,
          data: newPolicy,
        });
      }

      default:
        res.setHeader("Allow", ["GET", "POST"]);
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
