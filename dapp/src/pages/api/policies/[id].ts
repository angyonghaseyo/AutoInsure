import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  getPolicyById,
  updatePolicy,
  deletePolicy
} from '../../../backend/services/policyService';

type ResponseData = {
  success: boolean;
  data?: any;
  error?: string;
};

/**
 * API handler for /api/policies/[id]
 * GET: Returns a specific policy by ID
 * PUT: Updates a specific policy
 * DELETE: Removes a specific policy
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { method } = req;
  const { id } = req.query;

  // Validate ID
  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid policy ID'
    });
  }

  const policyId = parseInt(id, 10);
  
  if (isNaN(policyId)) {
    return res.status(400).json({
      success: false,
      error: 'Policy ID must be a number'
    });
  }

  try {
    switch (method) {
      case 'GET':
        // Get policy by ID
        const policy = await getPolicyById(policyId);
        
        if (!policy) {
          return res.status(404).json({
            success: false,
            error: 'Policy not found'
          });
        }
        
        return res.status(200).json({
          success: true,
          data: policy
        });
        
      case 'PUT':
        // Validate request body
        if (!req.body) {
          return res.status(400).json({
            success: false,
            error: 'Request body is required'
          });
        }
        
        // Prepare update data
        const updateData = {
          ...req.body,
          // Convert string dates to Date objects if provided
          ...(req.body.departureTime && {
            departureTime: new Date(req.body.departureTime)
          }),
          ...(req.body.actualDepartureTime && {
            actualDepartureTime: new Date(req.body.actualDepartureTime)
          })
        };
        
        // Update policy
        const updatedPolicy = await updatePolicy(policyId, updateData);
        
        if (!updatedPolicy) {
          return res.status(404).json({
            success: false,
            error: 'Policy not found'
          });
        }
        
        return res.status(200).json({
          success: true,
          data: updatedPolicy
        });
        
      case 'DELETE':
        // Delete policy
        const deleted = await deletePolicy(policyId);
        
        if (!deleted) {
          return res.status(404).json({
            success: false,
            error: 'Policy not found'
          });
        }
        
        return res.status(200).json({
          success: true,
          data: { message: `Policy ${policyId} deleted successfully` }
        });
        
      default:
        return res.status(405).json({
          success: false,
          error: `Method ${method} Not Allowed`
        });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}