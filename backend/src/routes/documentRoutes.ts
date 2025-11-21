import { Router, Request, Response } from 'express';
import { documentService } from '../services/documentService';

const router = Router();

/**
 * GET /api/documents
 * Get all available documents
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const documents = await documentService.getAllDocuments();
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

    const documentStructure = await documentService.getDocumentById(id);
    
    res.json({
      success: true,
      data: documentStructure,
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        message: error.message,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
