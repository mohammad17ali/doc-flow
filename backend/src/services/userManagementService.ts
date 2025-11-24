import { ObjectId } from 'mongodb';
import { UserModel } from '../models/User';
import { UserGroupModel } from '../models/UserGroup';
import { AuthService } from './authService';
import { CreateUserRequest, CreateUserGroupRequest, User, UserGroup } from '../types/auth';

export class UserManagementService {
  /**
   * Create a new user (admin function)
   */
  static async createUser(
    request: CreateUserRequest,
    createdBy?: string
  ): Promise<string> {
    // Validate username doesn't exist
    const existingUser = await UserModel.findByUsername(request.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Validate email doesn't exist
    const existingEmail = await UserModel.findByEmail(request.email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Validate password strength
    if (request.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Hash password
    const passwordHash = await AuthService.hashPassword(request.password);

    // Convert group IDs to ObjectIds
    const groupIds = request.groupIds
      ? request.groupIds.map(id => new ObjectId(id))
      : [];

    // Validate groups exist
    if (groupIds.length > 0) {
      const groups = await UserGroupModel.findByIds(groupIds);
      if (groups.length !== groupIds.length) {
        throw new Error('One or more groups do not exist');
      }
    }

    // Create user
    const userId = await UserModel.create({
      username: request.username,
      email: request.email,
      passwordHash,
      groupIds,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: createdBy ? new ObjectId(createdBy) : undefined,
    });

    return userId.toString();
  }

  /**
   * Update user information (admin function)
   */
  static async updateUser(
    userId: string,
    updates: {
      email?: string;
      password?: string;
      groupIds?: string[];
      isActive?: boolean;
    }
  ): Promise<boolean> {
    const updateData: Partial<User> = {};

    // Validate user exists
    const user = await UserModel.findById(new ObjectId(userId));
    if (!user) {
      throw new Error('User not found');
    }

    // Update email if provided
    if (updates.email && updates.email !== user.email) {
      const existingEmail = await UserModel.findByEmail(updates.email);
      if (existingEmail) {
        throw new Error('Email already exists');
      }
      updateData.email = updates.email;
    }

    // Update password if provided
    if (updates.password) {
      if (updates.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      updateData.passwordHash = await AuthService.hashPassword(updates.password);
    }

    // Update groups if provided
    if (updates.groupIds) {
      const groupIds = updates.groupIds.map(id => new ObjectId(id));
      const groups = await UserGroupModel.findByIds(groupIds);
      if (groups.length !== groupIds.length) {
        throw new Error('One or more groups do not exist');
      }
      updateData.groupIds = groupIds;
    }

    // Update active status if provided
    if (updates.isActive !== undefined) {
      updateData.isActive = updates.isActive;
      
      // If deactivating user, logout all sessions
      if (!updates.isActive) {
        await AuthService.logoutAllSessions(userId);
      }
    }

    return await UserModel.update(new ObjectId(userId), updateData);
  }

  /**
   * Delete user (admin function)
   */
  static async deleteUser(userId: string): Promise<boolean> {
    // Logout all sessions first
    await AuthService.logoutAllSessions(userId);
    
    // Delete user
    return await UserModel.delete(new ObjectId(userId));
  }

  /**
   * Get user by ID
   */
  static async getUser(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await UserModel.findById(new ObjectId(userId));
    
    if (!user) {
      return null;
    }

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * List all users
   */
  static async listUsers(activeOnly: boolean = false): Promise<Omit<User, 'passwordHash'>[]> {
    const filter = activeOnly ? { isActive: true } : {};
    const users = await UserModel.findAll(filter);
    
    // Remove password hashes from response
    return users.map(({ passwordHash, ...user }) => user);
  }

  /**
   * Create a new user group (admin function)
   */
  static async createUserGroup(
    request: CreateUserGroupRequest,
    createdBy?: string
  ): Promise<string> {
    // Validate group name doesn't exist
    const existingGroup = await UserGroupModel.findByName(request.name);
    if (existingGroup) {
      throw new Error('Group name already exists');
    }

    // Create group
    const groupId = await UserGroupModel.create({
      name: request.name,
      description: request.description,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: createdBy ? new ObjectId(createdBy) : undefined,
    });

    return groupId.toString();
  }

  /**
   * Update user group (admin function)
   */
  static async updateUserGroup(
    groupId: string,
    updates: {
      name?: string;
      description?: string;
      isActive?: boolean;
    }
  ): Promise<boolean> {
    const updateData: Partial<UserGroup> = {};

    // Validate group exists
    const group = await UserGroupModel.findById(new ObjectId(groupId));
    if (!group) {
      throw new Error('Group not found');
    }

    // Update name if provided
    if (updates.name && updates.name !== group.name) {
      const existingGroup = await UserGroupModel.findByName(updates.name);
      if (existingGroup) {
        throw new Error('Group name already exists');
      }
      updateData.name = updates.name;
    }

    // Update other fields
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    return await UserGroupModel.update(new ObjectId(groupId), updateData);
  }

  /**
   * Delete user group (admin function)
   */
  static async deleteUserGroup(groupId: string): Promise<boolean> {
    // Check if any users are in this group
    const users = await UserModel.findAll({ groupIds: new ObjectId(groupId) } as any);
    
    if (users.length > 0) {
      throw new Error(`Cannot delete group: ${users.length} user(s) are assigned to this group`);
    }

    return await UserGroupModel.delete(new ObjectId(groupId));
  }

  /**
   * Get user group by ID
   */
  static async getUserGroup(groupId: string): Promise<UserGroup | null> {
    return await UserGroupModel.findById(new ObjectId(groupId));
  }

  /**
   * List all user groups
   */
  static async listUserGroups(activeOnly: boolean = false): Promise<UserGroup[]> {
    const filter = activeOnly ? { isActive: true } : {};
    return await UserGroupModel.findAll(filter);
  }

  /**
   * Add user to group
   */
  static async addUserToGroup(userId: string, groupId: string): Promise<boolean> {
    const user = await UserModel.findById(new ObjectId(userId));
    const group = await UserGroupModel.findById(new ObjectId(groupId));

    if (!user) throw new Error('User not found');
    if (!group) throw new Error('Group not found');

    const groupObjectId = new ObjectId(groupId);
    
    // Check if user already in group
    if (user.groupIds.some(id => id.equals(groupObjectId))) {
      return false;
    }

    // Add group to user
    const updatedGroupIds = [...user.groupIds, groupObjectId];
    return await UserModel.update(new ObjectId(userId), { groupIds: updatedGroupIds });
  }

  /**
   * Remove user from group
   */
  static async removeUserFromGroup(userId: string, groupId: string): Promise<boolean> {
    const user = await UserModel.findById(new ObjectId(userId));
    
    if (!user) throw new Error('User not found');

    const groupObjectId = new ObjectId(groupId);
    
    // Remove group from user
    const updatedGroupIds = user.groupIds.filter(id => !id.equals(groupObjectId));
    return await UserModel.update(new ObjectId(userId), { groupIds: updatedGroupIds });
  }
}
