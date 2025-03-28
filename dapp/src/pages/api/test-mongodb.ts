import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../backend/lib/mongodb';

type ResponseData = {
  success: boolean;
  message?: string;
  error?: string;
  connectionInfo?: {
    database: string;
    collections?: string[];
  };
};

/**
 * API route to test MongoDB connection
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    // Test database connection
    const { db, client } = await connectToDatabase();
    
    // Get list of collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    // Return success response with DB info
    res.status(200).json({ 
      success: true, 
      message: 'MongoDB connection successful!',
      connectionInfo: {
        database: db.databaseName,
        collections: collectionNames
      }
    });
  } catch (error: any) {
    console.error('MongoDB connection error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to connect to MongoDB'
    });
  }
}