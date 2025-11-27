import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  username: string;
  email: string;
  fullName?: string;
  passwordHash: string;
  groupIds: ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: ObjectId;
  lastLogin?: Date;
}

export interface UserGroup {
  _id?: ObjectId;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: ObjectId;
}

export interface Session {
  _id?: ObjectId;
  userId: ObjectId;
  sessionToken: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  fullName?: string;
  password: string;
  groupIds?: string[];
}

export interface CreateUserGroupRequest {
  name: string;
  description: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthenticatedUser {
  userId: string;
  username: string;
  email: string;
  fullName?: string;
  groups: string[]; // Group names for display/checking
  groupIds: string[]; // Group ObjectId strings for permission queries
}
