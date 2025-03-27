import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

if (!process.env.MONGODB_DB) {
  throw new Error('Please define the MONGODB_DB environment variable inside .env.local');
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

interface MongoConnection {
  client: MongoClient;
  db: Db;
}

interface CachedConnection {
  conn: MongoConnection | null;
  promise: Promise<MongoConnection> | null;
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
declare global {
  var mongodb: CachedConnection | undefined;
}

let cached = global.mongodb;

if (!cached) {
  cached = global.mongodb = { conn: null, promise: null };
}

/**
 * Connect to MongoDB database
 */
export async function connectToDatabase(): Promise<MongoConnection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    cached.promise = MongoClient.connect(uri)
      .then((client) => {
        return {
          client,
          db: client.db(dbName),
        };
      });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}