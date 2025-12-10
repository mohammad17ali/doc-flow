import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { documentService } from '../services/documentService';
import { AuthService } from '../services/authService';
import { authenticate } from '../middleware/auth';

const router = Router();

// Protect all document routes - require authentication
router.use(authenticate);

/**
 * GET /api/documents
 * Get all available documents (filtered by user's group permissions)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Get user's group IDs
    const userGroupIds = req.user.groupIds.map(groupId => new ObjectId(groupId));
    const isAdminUser = AuthService.isInGroup(req.user, 'admin');

    const documents = await documentService.getAllDocuments(userGroupIds, isAdminUser);
    res.json({
      success: true,
      data: documents,
      count: documents.length,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/documents/:id
 * Get a specific document's output_tree.json
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Document ID is required',
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Get user's group IDs
    const userGroupIds = req.user.groupIds.map(groupId => new ObjectId(groupId));
    const isAdminUser = AuthService.isInGroup(req.user, 'admin');

    const documentStructure = await documentService.getDocumentById(id, userGroupIds, isAdminUser);
    
    res.json({
      success: true,
      data: documentStructure,
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: error.message,
        });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Document not found',
          message: error.message,
        });
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/documents/:id/images
 * Get list of all images for a specific document
 */
router.get('/:id/images', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Document ID is required',
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Get user's group IDs
    const userGroupIds = req.user.groupIds.map(groupId => new ObjectId(groupId));
    const isAdminUser = AuthService.isInGroup(req.user, 'admin');

    const images = await documentService.getDocumentImages(id, userGroupIds, isAdminUser);
    
    res.json({
      success: true,
      data: images,
      count: images.length,
    });
  } catch (error) {
    console.error('Error fetching document images:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: error.message,
        });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Document not found',
          message: error.message,
        });
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document images',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
