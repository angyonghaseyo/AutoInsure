import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  getUserProfile,
  upsertUser
} from '../../../backend/services/userService';

type ResponseData = {
  success: boolean;
  data?: any;
  error?: string;
};

/**
 * API handler for /api/users/[address]
 * GET: Returns user profile and policies
 * PUT: Updates user profile data
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { method } = req;
  const { address } = req.query;

  // Validate address
  if (!address || Array.isArray(address)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Ethereum address'
    });
  }

  try {
    switch (method) {
      case 'GET':
        // Get user profile
        const profile = await getUserProfile(address);
        
        if (!profile) {
          return res.status(404).json({
            success: false,
            error: 'User not found'
          });
        }
        
        return res.status(200).json({
          success: true,
          data: profile
        });
        
      case 'PUT':
        // Validate request body
        if (!req.body) {
          return res.status(400).json({
            success: false,
            error: 'Request body is required'
          });
        }
        
        // Update user profile
        const updatedUser = await upsertUser(address, req.body);
        
        return res.status(200).json({
          success: true,
          data: updatedUser
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