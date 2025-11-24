import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { authenticate } from '../middleware/auth';
import { LoginRequest } from '../types/auth';

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

export default router;
