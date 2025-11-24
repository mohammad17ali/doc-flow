import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import { User } from '../types/auth';

export class UserModel {
  private static COLLECTION_NAME = 'users';

  static getCollection(): Collection<User> {
    const db = getDatabase();
    return db.collection<User>(this.COLLECTION_NAME);
  }

  static async createIndexes(): Promise<void> {
    const collection = this.getCollection();
    
    // Unique index on username
    await collection.createIndex({ username: 1 }, { unique: true });
    
    // Unique index on email
    await collection.createIndex({ email: 1 }, { unique: true });
    
    // Index on groupIds for efficient lookups
    await collection.createIndex({ groupIds: 1 });
    
    // Index on isActive for filtering
    await collection.createIndex({ isActive: 1 });
    
    console.log('✅ User indexes created');
  }

  static async findByUsername(username: string): Promise<User | null> {
    const collection = this.getCollection();
    return await collection.findOne({ username });
  }

  static async findByEmail(email: string): Promise<User | null> {
    const collection = this.getCollection();
    return await collection.findOne({ email });
  }

  static async findById(id: ObjectId): Promise<User | null> {
    const collection = this.getCollection();
    return await collection.findOne({ _id: id });
  }

  static async create(user: Omit<User, '_id'>): Promise<ObjectId> {
    const collection = this.getCollection();
    const result = await collection.insertOne(user as User);
    return result.insertedId;
  }

  static async updateLastLogin(userId: ObjectId): Promise<void> {
    const collection = this.getCollection();
    await collection.updateOne(
      { _id: userId },
      { $set: { lastLogin: new Date() } }
    );
  }

  static async update(userId: ObjectId, updates: Partial<User>): Promise<boolean> {
    const collection = this.getCollection();
    const result = await collection.updateOne(
      { _id: userId },
      { $set: { ...updates, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  static async delete(userId: ObjectId): Promise<boolean> {
    const collection = this.getCollection();
    const result = await collection.deleteOne({ _id: userId });
    return result.deletedCount > 0;
  }

  static async findAll(filter: Partial<User> = {}): Promise<User[]> {
    const collection = this.getCollection();
    return await collection.find(filter).toArray();
  }
}
