import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { authenticate } from '../middleware/auth';
import { LoginRequest } from '../types/auth';
import { UserModel } from '../models/User';
import { ObjectId } from 'mongodb';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate user and create session
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const credentials: LoginRequest = req.body;

    // Validate input
    if (!credentials.username || !credentials.password) {
      res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
      return;
    }

    // Get IP and user agent for session tracking
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Attempt login
    const result = await AuthService.login(credentials, ipAddress, userAgent);

    if (!result) {
      res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        sessionToken: result.sessionToken,
        user: result.user,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
});

/**
 * POST /api/auth/logout
 * Invalidate current session
 */
router.post('/logout', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.sessionToken) {
      res.status(400).json({
        success: false,
        message: 'No active session',
      });
      return;
    }

    const success = await AuthService.logout(req.sessionToken);

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user info
 */
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error: any) {
    console.error('Get user info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information',
    });
  }
});

/**
 * POST /api/auth/validate
 * Validate session token (for frontend to check if session is still valid)
 */
router.post('/validate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      res.status(400).json({
        success: false,
        message: 'Session token is required',
      });
      return;
    }

    const user = await AuthService.validateSession(sessionToken);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired session',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Session validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Session validation failed',
    });
  }
});

/**
 * PUT /api/auth/update-profile
 * Update user's profile information (email, fullName)
 */
router.put('/update-profile', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, fullName } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    // Validate input
    if (!email && !fullName) {
      res.status(400).json({
        success: false,
        message: 'At least one field (email or fullName) is required',
      });
      return;
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format',
        });
        return;
      }

      // Check if email is already in use by another user
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser && existingUser._id!.toString() !== userId) {
        res.status(400).json({
          success: false,
          message: 'Email is already in use',
        });
        return;
      }
    }

    // Build update object
    const updates: any = {};
    if (email) updates.email = email;
    if (fullName !== undefined) updates.fullName = fullName;

    // Update user
    const success = await UserModel.update(new ObjectId(userId), updates);

    if (!success) {
      res.status(400).json({
        success: false,
        message: 'Failed to update profile',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile',
    });
  }
});

/**
 * PUT /api/auth/change-password
 * Change user's password (requires current password)
 */
router.put('/change-password', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    // Validate input
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
      return;
    }

    // Validate new password length
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
      return;
    }

    // Get user
    const user = await UserModel.findById(new ObjectId(userId));
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Verify current password
    const isValidPassword = await AuthService.verifyPassword(
      currentPassword,
      user.passwordHash
    );

    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
      return;
    }

    // Hash new password
    const newPasswordHash = await AuthService.hashPassword(newPassword);

    // Update password
    const success = await UserModel.update(new ObjectId(userId), {
      passwordHash: newPasswordHash,
    });

    if (!success) {
      res.status(400).json({
        success: false,
        message: 'Failed to update password',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to change password',
    });
  }
});

export default router;
