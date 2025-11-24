import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import { Document } from '../types/document';

export class DocumentModel {
  private static COLLECTION_NAME = 'documents';

  static getCollection(): Collection<Document> {
    const db = getDatabase();
    return db.collection<Document>(this.COLLECTION_NAME);
  }

  static async createIndexes(): Promise<void> {
    const collection = this.getCollection();
    
    // Unique index on document ID (folder name)
    await collection.createIndex({ documentId: 1 }, { unique: true });
    
    // Index on group permissions for efficient access checks
    await collection.createIndex({ 'permissions.groupId': 1 });
    
    // Index on isActive
    await collection.createIndex({ isActive: 1 });
    
    console.log('✅ Document indexes created');
  }

  static async findByDocumentId(documentId: string): Promise<Document | null> {
    const collection = this.getCollection();
    return await collection.findOne({ documentId, isActive: true });
  }

  static async findById(id: ObjectId): Promise<Document | null> {
    const collection = this.getCollection();
    return await collection.findOne({ _id: id });
  }

  static async create(document: Omit<Document, '_id'>): Promise<ObjectId> {
    const collection = this.getCollection();
    const result = await collection.insertOne(document as Document);
    return result.insertedId;
  }

  static async update(documentId: string, updates: Partial<Document>): Promise<boolean> {
    const collection = this.getCollection();
    const result = await collection.updateOne(
      { documentId },
      { $set: { ...updates, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  static async delete(documentId: string): Promise<boolean> {
    const collection = this.getCollection();
    const result = await collection.updateOne(
      { documentId },
      { $set: { isActive: false, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  static async findAll(filter: Partial<Document> = {}): Promise<Document[]> {
    const collection = this.getCollection();
    return await collection.find({ ...filter, isActive: true }).toArray();
  }

  /**
   * Find all documents accessible by specific group IDs
   */
  static async findByGroupIds(groupIds: ObjectId[]): Promise<Document[]> {
    const collection = this.getCollection();
    return await collection.find({
      'permissions.groupId': { $in: groupIds },
      isActive: true
    }).toArray();
  }

  /**
   * Check if a user group has access to a specific document
   */
  static async hasAccess(documentId: string, groupIds: ObjectId[]): Promise<boolean> {
    const collection = this.getCollection();
    const document = await collection.findOne({
      documentId,
      'permissions.groupId': { $in: groupIds },
      isActive: true
    });
    return document !== null;
  }

  /**
   * Add a group permission to a document
   */
  static async addPermission(
    documentId: string, 
    groupId: ObjectId
  ): Promise<boolean> {
    const collection = this.getCollection();
    const result = await collection.updateOne(
      { documentId },
      { 
        $addToSet: { 
          permissions: { groupId } 
        },
        $set: { updatedAt: new Date() }
      }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Remove a group permission from a document
   */
  static async removePermission(documentId: string, groupId: ObjectId): Promise<boolean> {
    const collection = this.getCollection();
    const result = await collection.updateOne(
      { documentId },
      { 
        $pull: { 
          permissions: { groupId } as any
        },
        $set: { updatedAt: new Date() }
      }
    );
    return result.modifiedCount > 0;
  }
}
