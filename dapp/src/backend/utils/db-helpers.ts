import { Document, Filter, Sort, FindOptions, WithId, ReturnDocument } from "mongodb";
import { connectToDatabase } from "../lib/mongodb";
import { FlightPolicyTemplateStatus } from "@/types/FlightPolicy";

/**
 * Find documents in a collection with filters, sorting and pagination
 */
export async function findDocuments<T extends Document>(
  collection: string,
  filter: Filter<T> = {},
  sort: Sort = { createdAt: -1 },
  limit: number = 100,
  skip: number = 0,
  options: FindOptions<T> = {}
): Promise<WithId<T>[]> {
  const db = await connectToDatabase();
  const documents = await db.collection<T>(collection).find(filter, options).sort(sort).skip(skip).limit(limit).toArray();
  return documents;
}

/**
 * Find a single document by ID
 */
export async function findDocumentById<T extends Document>(collection: string, templateId: number | string, idField: string = "templateId"): Promise<WithId<T> | null> {
  const db = await connectToDatabase();

  const filter = { [idField]: templateId } as unknown as Filter<T>;
  const document = await db.collection<T>(collection).findOne(filter);

  return document;
}

/**
 * Insert a document into a collection
 */
export async function insertDocument<T extends Document>(collection: string, document: T): Promise<WithId<T>> {
  const db = await connectToDatabase();

  // Add timestamps
  const documentWithTimestamps = {
    ...document,
    templateId: crypto.randomUUID(),
    createdAt: new Date().getTime(),
    updatedAt: new Date().getTime(),
    status: FlightPolicyTemplateStatus.Active,
  };

  const result = await db.collection<T>(collection).insertOne(documentWithTimestamps as any);

  return {
    ...documentWithTimestamps,
    _id: result.insertedId,
  } as unknown as WithId<T>;
}

/**
 * Update a document in a collection
 */
export async function updateDocument<T extends Document>(
  collection: string,
  templateId: number | string,
  update: Partial<T>,
  idField: string = "templateId"
): Promise<WithId<T> | null> {
  const db = await connectToDatabase();

  // Add updated timestamp
  const updateWithTimestamp = {
    ...update,
    updatedAt: new Date().getTime(),
  };

  const filter = { [idField]: templateId } as unknown as Filter<T>;
  const options = { returnDocument: "after" };

  const result = await db.collection<T>(collection).findOneAndUpdate(filter, { $set: updateWithTimestamp }, { returnDocument: ReturnDocument.AFTER });

  return result as unknown as WithId<T> | null;
}
