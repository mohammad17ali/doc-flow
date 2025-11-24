import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { AuthenticatedUser } from '../types/auth';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionToken?: string;
    }
  }
}

/**
 * Middleware to authenticate requests using session token
 * Expects Authorization header: Bearer <session-token>
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No authentication token provided',
      });
      return;
    }

    const sessionToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate session and get user
    const user = await AuthService.validateSession(sessionToken);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired session',
      });
      return;
    }

    // Attach user and token to request
    req.user = user;
    req.sessionToken = sessionToken;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
}

/**
 * Middleware to require admin group membership
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  if (!AuthService.isInGroup(req.user, 'admin')) {
    res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
    return;
  }

  next();
}

/**
 * Middleware to require user to be in specific group
 */
export function requireGroup(groupName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!AuthService.isInGroup(req.user, groupName)) {
      res.status(403).json({
        success: false,
        message: `Access denied: ${groupName} group membership required`,
      });
      return;
    }

    next();
  };
}



/**
 * Optional authentication - attach user if token is valid, but don't fail if not
 */
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const sessionToken = authHeader.substring(7);
    const user = await AuthService.validateSession(sessionToken);

    if (user) {
      req.user = user;
      req.sessionToken = sessionToken;
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
}
