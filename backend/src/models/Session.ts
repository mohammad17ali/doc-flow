import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import { Session } from '../types/auth';

export class SessionModel {
  private static COLLECTION_NAME = 'sessions';

  static getCollection(): Collection<Session> {
    const db = getDatabase();
    return db.collection<Session>(this.COLLECTION_NAME);
  }

  static async createIndexes(): Promise<void> {
    const collection = this.getCollection();
    
    // Unique index on session token
    await collection.createIndex({ sessionToken: 1 }, { unique: true });
    
    // Index on userId for user session lookup
    await collection.createIndex({ userId: 1 });
    
    // Index on expiresAt with TTL (auto-delete expired sessions)
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    
    console.log('✅ Session indexes created');
  }

  static async create(session: Omit<Session, '_id'>): Promise<ObjectId> {
    const collection = this.getCollection();
    const result = await collection.insertOne(session as Session);
    return result.insertedId;
  }

  static async findByToken(sessionToken: string): Promise<Session | null> {
    const collection = this.getCollection();
    return await collection.findOne({ 
      sessionToken,
      expiresAt: { $gt: new Date() }
    });
  }

  static async deleteByToken(sessionToken: string): Promise<boolean> {
    const collection = this.getCollection();
    const result = await collection.deleteOne({ sessionToken });
    return result.deletedCount > 0;
  }

  static async deleteByUserId(userId: ObjectId): Promise<number> {
    const collection = this.getCollection();
    const result = await collection.deleteMany({ userId });
    return result.deletedCount;
  }

  static async deleteExpiredSessions(): Promise<number> {
    const collection = this.getCollection();
    const result = await collection.deleteMany({ 
      expiresAt: { $lte: new Date() } 
    });
    return result.deletedCount;
  }
}
