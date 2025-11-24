import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { UserManagementService } from '../services/userManagementService';
import { DocumentModel } from '../models/Document';
import { documentService } from '../services/documentService';
import { authenticate, requireAdmin } from '../middleware/auth';
import { CreateUserRequest, CreateUserGroupRequest } from '../types/auth';
import fs from 'fs/promises';
import path from 'path';
import { OUTPUTS_DIR } from '../config/paths';

const router = Router();

// All routes require authentication and admin permission
router.use(authenticate);
router.use(requireAdmin);

// ============ USER MANAGEMENT ============

/**
 * POST /api/admin/users
 * Create a new user
 */
router.post('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const userRequest: CreateUserRequest = req.body;

    // Validate input
    if (!userRequest.username || !userRequest.email || !userRequest.password) {
      res.status(400).json({
        success: false,
        message: 'Username, email, and password are required',
      });
      return;
    }

    const userId = await UserManagementService.createUser(
      userRequest,
      req.user?.userId
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { userId },
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create user',
    });
  }
});

/**
 * GET /api/admin/users
 * List all users
 */
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const users = await UserManagementService.listUsers(activeOnly);

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    console.error('List users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list users',
    });
  }
});

/**
 * GET /api/admin/users/:userId
 * Get user by ID
 */
router.get('/users/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await UserManagementService.getUser(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
    });
  }
});

/**
 * PUT /api/admin/users/:userId
 * Update user
 */
router.put('/users/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const success = await UserManagementService.updateUser(userId, updates);

    if (!success) {
      res.status(404).json({
        success: false,
        message: 'User not found or no changes made',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update user',
    });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete user
 */
router.delete('/users/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Prevent deleting yourself
    if (userId === req.user?.userId) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
      return;
    }

    const success = await UserManagementService.deleteUser(userId);

    if (!success) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
});

/**
 * POST /api/admin/users/:userId/groups/:groupId
 * Add user to group
 */
router.post('/users/:userId/groups/:groupId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, groupId } = req.params;
    const success = await UserManagementService.addUserToGroup(userId, groupId);

    if (!success) {
      res.status(400).json({
        success: false,
        message: 'User already in group or operation failed',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User added to group successfully',
    });
  } catch (error: any) {
    console.error('Add user to group error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add user to group',
    });
  }
});

/**
 * DELETE /api/admin/users/:userId/groups/:groupId
 * Remove user from group
 */
router.delete('/users/:userId/groups/:groupId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, groupId } = req.params;
    const success = await UserManagementService.removeUserFromGroup(userId, groupId);

    res.status(200).json({
      success: true,
      message: 'User removed from group successfully',
    });
  } catch (error: any) {
    console.error('Remove user from group error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to remove user from group',
    });
  }
});

// ============ USER GROUP MANAGEMENT ============

/**
 * POST /api/admin/groups
 * Create a new user group
 */
router.post('/groups', async (req: Request, res: Response): Promise<void> => {
  try {
    const groupRequest: CreateUserGroupRequest = req.body;

    // Validate input
    if (!groupRequest.name || !groupRequest.description) {
      res.status(400).json({
        success: false,
        message: 'Name and description are required',
      });
      return;
    }

    const groupId = await UserManagementService.createUserGroup(
      groupRequest,
      req.user?.userId
    );

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: { groupId },
    });
  } catch (error: any) {
    console.error('Create group error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create group',
    });
  }
});

/**
 * GET /api/admin/groups
 * List all user groups
 */
router.get('/groups', async (req: Request, res: Response): Promise<void> => {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const groups = await UserManagementService.listUserGroups(activeOnly);

    res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error: any) {
    console.error('List groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list groups',
    });
  }
});

/**
 * GET /api/admin/groups/:groupId
 * Get group by ID
 */
router.get('/groups/:groupId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const group = await UserManagementService.getUserGroup(groupId);

    if (!group) {
      res.status(404).json({
        success: false,
        message: 'Group not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error: any) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get group',
    });
  }
});

/**
 * PUT /api/admin/groups/:groupId
 * Update user group
 */
router.put('/groups/:groupId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const updates = req.body;

    const success = await UserManagementService.updateUserGroup(groupId, updates);

    if (!success) {
      res.status(404).json({
        success: false,
        message: 'Group not found or no changes made',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Group updated successfully',
    });
  } catch (error: any) {
    console.error('Update group error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update group',
    });
  }
});

/**
 * DELETE /api/admin/groups/:groupId
 * Delete user group
 */
router.delete('/groups/:groupId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const success = await UserManagementService.deleteUserGroup(groupId);

    if (!success) {
      res.status(404).json({
        success: false,
        message: 'Group not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete group error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete group',
    });
  }
});

// ============ DOCUMENT PERMISSION MANAGEMENT ============

/**
 * GET /api/admin/documents
 * List all documents with their permissions (admin view)
 */
router.get('/documents', async (req: Request, res: Response): Promise<void> => {
  try {
    const documents = await DocumentModel.findAll();
    
    res.status(200).json({
      success: true,
      data: documents,
      count: documents.length,
    });
  } catch (error: any) {
    console.error('List documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list documents',
    });
  }
});

/**
 * GET /api/admin/documents/scan
 * Scan outputs directory for new documents
 */
router.get('/documents/scan', async (req: Request, res: Response): Promise<void> => {
  try {
    const entries = await fs.readdir(OUTPUTS_DIR, { withFileTypes: true });
    const existingDocs = await DocumentModel.findAll();
    const existingDocIds = new Set(existingDocs.map(doc => doc.documentId));
    
    const availableFolders = [];
    const newFolders = [];
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        availableFolders.push(entry.name);
        if (!existingDocIds.has(entry.name)) {
          newFolders.push(entry.name);
        }
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        availableFolders,
        newFolders,
        existingDocuments: Array.from(existingDocIds),
      },
    });
  } catch (error: any) {
    console.error('Scan documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scan documents',
    });
  }
});

/**
 * POST /api/admin/documents
 * Create a new document record (without initial permissions)
 */
router.post('/documents', async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentId, name, description, metadata } = req.body;
    
    if (!documentId) {
      res.status(400).json({
        success: false,
        message: 'documentId is required',
      });
      return;
    }
    
    // Check if folder exists
    const docPath = path.join(OUTPUTS_DIR, documentId);
    try {
      const stats = await fs.stat(docPath);
      if (!stats.isDirectory()) {
        res.status(400).json({
          success: false,
          message: 'Document folder is not a directory',
        });
        return;
      }
    } catch (error) {
      res.status(404).json({
        success: false,
        message: 'Document folder not found',
      });
      return;
    }
    
    // Get file count
    const files = await fs.readdir(docPath);
    const fileCount = files.length;
    
    // Create document without permissions (admin will assign later)
    const docObjectId = await DocumentModel.create({
      documentId,
      name: name || documentId,
      description,
      filePath: docPath,
      permissions: [], // No initial permissions
      metadata: {
        ...metadata,
        fileCount,
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user?.userId ? new ObjectId(req.user.userId) : undefined,
    });
    
    res.status(201).json({
      success: true,
      message: 'Document created successfully',
      data: { documentId: docObjectId },
    });
  } catch (error: any) {
    console.error('Create document error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create document',
    });
  }
});

/**
 * GET /api/admin/documents/:documentId
 * Get document details with permissions
 */
router.get('/documents/:documentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const document = await DocumentModel.findByDocumentId(documentId);
    
    if (!document) {
      res.status(404).json({
        success: false,
        message: 'Document not found',
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error: any) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get document',
    });
  }
});

/**
 * PUT /api/admin/documents/:documentId
 * Update document metadata
 */
router.put('/documents/:documentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const { name, description, metadata } = req.body;
    
    const updates: any = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (metadata) updates.metadata = metadata;
    
    const success = await DocumentModel.update(documentId, updates);
    
    if (!success) {
      res.status(404).json({
        success: false,
        message: 'Document not found or no changes made',
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message: 'Document updated successfully',
    });
  } catch (error: any) {
    console.error('Update document error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update document',
    });
  }
});

/**
 * DELETE /api/admin/documents/:documentId
 * Soft delete a document
 */
router.delete('/documents/:documentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const success = await DocumentModel.delete(documentId);
    
    if (!success) {
      res.status(404).json({
        success: false,
        message: 'Document not found',
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
    });
  }
});

/**
 * POST /api/admin/documents/:documentId/permissions
 * Add a group permission to a document
 */
router.post('/documents/:documentId/permissions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const { groupId } = req.body;
    
    if (!groupId) {
      res.status(400).json({
        success: false,
        message: 'groupId is required',
      });
      return;
    }
    
    const success = await DocumentModel.addPermission(
      documentId,
      new ObjectId(groupId)
    );
    
    if (!success) {
      res.status(400).json({
        success: false,
        message: 'Failed to add permission (document may not exist or permission already exists)',
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message: 'Permission added successfully',
    });
  } catch (error: any) {
    console.error('Add permission error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add permission',
    });
  }
});

/**
 * DELETE /api/admin/documents/:documentId/permissions/:groupId
 * Remove a group permission from a document
 */
router.delete('/documents/:documentId/permissions/:groupId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentId, groupId } = req.params;
    
    const success = await DocumentModel.removePermission(
      documentId,
      new ObjectId(groupId)
    );
    
    if (!success) {
      res.status(400).json({
        success: false,
        message: 'Failed to remove permission',
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message: 'Permission removed successfully',
    });
  } catch (error: any) {
    console.error('Remove permission error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to remove permission',
    });
  }
});

/**
 * PUT /api/admin/documents/:documentId/permissions
 * Replace all permissions for a document
 */
router.put('/documents/:documentId/permissions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const { permissions } = req.body;
    
    if (!Array.isArray(permissions)) {
      res.status(400).json({
        success: false,
        message: 'permissions must be an array',
      });
      return;
    }
    
    // Validate and convert permissions
    const validPermissions = permissions.map(perm => {
      if (!perm.groupId) {
        throw new Error('Each permission must have a groupId');
      }
      return {
        groupId: new ObjectId(perm.groupId),
      };
    });
    
    const success = await DocumentModel.update(documentId, {
      permissions: validPermissions,
    });
    
    if (!success) {
      res.status(404).json({
        success: false,
        message: 'Document not found',
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message: 'Permissions updated successfully',
    });
  } catch (error: any) {
    console.error('Update permissions error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update permissions',
    });
  }
});

/**
 * POST /api/admin/users/:userId/groups
 * Add user to multiple groups at once
 */
router.post('/users/:userId/groups', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { groupIds } = req.body;
    
    if (!Array.isArray(groupIds)) {
      res.status(400).json({
        success: false,
        message: 'groupIds must be an array',
      });
      return;
    }
    
    let addedCount = 0;
    const errors = [];
    
    for (const groupId of groupIds) {
      try {
        const success = await UserManagementService.addUserToGroup(userId, groupId);
        if (success) {
          addedCount++;
        }
      } catch (error: any) {
        errors.push({ groupId, error: error.message });
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Added user to ${addedCount} group(s)`,
      data: {
        addedCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error: any) {
    console.error('Add user to groups error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add user to groups',
    });
  }
});

export default router;
