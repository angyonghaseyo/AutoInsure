import { MongoClient, ServerApiVersion } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

if (!process.env.MONGODB_DB) {
  throw new Error("Please define the MONGODB_DB environment variable inside .env.local");
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

let cachedClient: MongoClient | null = null;

export async function connectToDatabase() {
  // Return the cached client if it exists
  if (cachedClient) {
    return cachedClient.db(dbName);
  }

  // Create a new MongoClient instance and connect
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  await client.connect();
  // Cache the client for reuse
  cachedClient = client;
  return client.db(dbName);
}
