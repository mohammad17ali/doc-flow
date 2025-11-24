import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import { UserGroup } from '../types/auth';

export class UserGroupModel {
  private static COLLECTION_NAME = 'userGroups';

  static getCollection(): Collection<UserGroup> {
    const db = getDatabase();
    return db.collection<UserGroup>(this.COLLECTION_NAME);
  }

  static async createIndexes(): Promise<void> {
    const collection = this.getCollection();
    
    // Unique index on group name
    await collection.createIndex({ name: 1 }, { unique: true });
    
    // Index on isActive
    await collection.createIndex({ isActive: 1 });
    
    console.log('✅ UserGroup indexes created');
  }

  static async findByName(name: string): Promise<UserGroup | null> {
    const collection = this.getCollection();
    return await collection.findOne({ name });
  }

  static async findById(id: ObjectId): Promise<UserGroup | null> {
    const collection = this.getCollection();
    return await collection.findOne({ _id: id });
  }

  static async findByIds(ids: ObjectId[]): Promise<UserGroup[]> {
    const collection = this.getCollection();
    return await collection.find({ _id: { $in: ids } }).toArray();
  }

  static async create(group: Omit<UserGroup, '_id'>): Promise<ObjectId> {
    const collection = this.getCollection();
    const result = await collection.insertOne(group as UserGroup);
    return result.insertedId;
  }

  static async update(groupId: ObjectId, updates: Partial<UserGroup>): Promise<boolean> {
    const collection = this.getCollection();
    const result = await collection.updateOne(
      { _id: groupId },
      { $set: { ...updates, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  static async delete(groupId: ObjectId): Promise<boolean> {
    const collection = this.getCollection();
    const result = await collection.deleteOne({ _id: groupId });
    return result.deletedCount > 0;
  }

  static async findAll(filter: Partial<UserGroup> = {}): Promise<UserGroup[]> {
    const collection = this.getCollection();
    return await collection.find(filter).toArray();
  }
}
