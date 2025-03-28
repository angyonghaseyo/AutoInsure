import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  getPolicies, 
  createPolicy 
} from '../../../backend/services/policyService';
import { PolicyStatus } from '../../../backend/models/types/Policy';

type ResponseData = {
  success: boolean;
  data?: any;
  error?: string;
};

/**
 * API handler for /api/policies
 * GET: Returns a list of policies with optional filters
 * POST: Creates a new policy
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        // Extract query parameters
        const { 
          policyholder, 
          status, 
          flightNumber,
          limit = '100',
          skip = '0'
        } = req.query;
        
        // Build filter
        const filter: Record<string, any> = {};
        if (policyholder) filter.policyholder = String(policyholder).toLowerCase();
        if (status) filter.status = status;
        if (flightNumber) filter.flightNumber = flightNumber;
        
        // Get policies
        const policies = await getPolicies(
          filter, 
          Number(limit), 
          Number(skip)
        );
        
        // Return response
        return res.status(200).json({ 
          success: true, 
          data: policies 
        });
        
      case 'POST':
        // Validate request body
        if (!req.body) {
          return res.status(400).json({ 
            success: false, 
            error: 'Request body is required' 
          });
        }
        
        // Set default values
        const policy = {
          ...req.body,
          status: req.body.status || PolicyStatus.Active,
          isPaid: req.body.isPaid || false,
          isClaimed: req.body.isClaimed || false,
          // Convert string dates to Date objects if needed
          departureTime: req.body.departureTime 
            ? new Date(req.body.departureTime) 
            : new Date(),
          // Normalize policyholder address
          policyholder: req.body.policyholder 
            ? req.body.policyholder.toLowerCase() 
            : null
        };
        
        // Create policy
        const createdPolicy = await createPolicy(policy);
        
        // Return response
        return res.status(201).json({ 
          success: true, 
          data: createdPolicy 
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