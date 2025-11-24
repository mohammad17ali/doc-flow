import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { UserModel } from '../models/User';
import { UserGroupModel } from '../models/UserGroup';
import { SessionModel } from '../models/Session';
import { LoginRequest, AuthenticatedUser } from '../types/auth';

const SALT_ROUNDS = 10;
const SESSION_DURATION_HOURS = 24; // Sessions last 24 hours

export class AuthService {
  /**
   * Hash a plain text password
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Verify a password against a hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate a secure random session token
   */
  static generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Authenticate user with username and password
   * Returns session token if successful
   */
  static async login(
    credentials: LoginRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ sessionToken: string; user: AuthenticatedUser } | null> {
    // Find user by username
    const user = await UserModel.findByUsername(credentials.username);
    
    if (!user) {
      return null;
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(
      credentials.password,
      user.passwordHash
    );

    if (!isValidPassword) {
      return null;
    }

    // Get user groups
    const groups = await UserGroupModel.findByIds(user.groupIds);

    // Generate session token
    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

    // Create session
    await SessionModel.create({
      userId: user._id!,
      sessionToken,
      expiresAt,
      createdAt: new Date(),
      ipAddress,
      userAgent,
    });

    // Update last login
    await UserModel.updateLastLogin(user._id!);

    // Return session token and user info
    return {
      sessionToken,
      user: {
        userId: user._id!.toString(),
        username: user.username,
        email: user.email,
        groups: groups.map(g => g.name),
        groupIds: groups.map(g => g._id!.toString()),
      },
    };
  }

  /**
   * Logout user by invalidating session
   */
  static async logout(sessionToken: string): Promise<boolean> {
    return await SessionModel.deleteByToken(sessionToken);
  }

  /**
   * Validate session and return authenticated user
   */
  static async validateSession(sessionToken: string): Promise<AuthenticatedUser | null> {
    // Find active session
    const session = await SessionModel.findByToken(sessionToken);
    
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await SessionModel.deleteByToken(sessionToken);
      return null;
    }

    // Get user
    const user = await UserModel.findById(session.userId);
    
    if (!user || !user.isActive) {
      await SessionModel.deleteByToken(sessionToken);
      return null;
    }

    // Get user groups
    const groups = await UserGroupModel.findByIds(user.groupIds);

    return {
      userId: user._id!.toString(),
      username: user.username,
      email: user.email,
      groups: groups.map(g => g.name),
      groupIds: groups.map(g => g._id!.toString()),
    };
  }

  /**
   * Logout all sessions for a user
   */
  static async logoutAllSessions(userId: string): Promise<number> {
    return await SessionModel.deleteByUserId(new ObjectId(userId));
  }

  /**
   * Check if user is in a specific group
   */
  static isInGroup(user: AuthenticatedUser, groupName: string): boolean {
    return user.groups.includes(groupName);
  }
}
