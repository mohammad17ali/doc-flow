import fs from 'fs/promises';
import path from 'path';
import { ObjectId } from 'mongodb';
import { OUTPUTS_DIR, OUTPUT_TREE_FILENAME } from '../config/paths';
import { DocumentMetadata, DocumentStructure } from '../types/document';
import { DocumentModel } from '../models/Document';

/**
 * Service for handling document operations
 */
export class DocumentService {
  /**
   * Get all available documents from the outputs directory
   * Filtered by user's group permissions
   */
  async getAllDocuments(userGroupIds: ObjectId[]): Promise<DocumentMetadata[]> {
    try {
      // Get documents user has access to from database
      const accessibleDocs = await DocumentModel.findByGroupIds(userGroupIds);
      const accessibleDocIds = new Set(accessibleDocs.map(doc => doc.documentId));
      
      const entries = await fs.readdir(OUTPUTS_DIR, { withFileTypes: true });
      
      const documents: DocumentMetadata[] = [];
      
      for (const entry of entries) {
        if (entry.isDirectory() && accessibleDocIds.has(entry.name)) {
          const docPath = path.join(OUTPUTS_DIR, entry.name);
          const outputTreePath = path.join(docPath, OUTPUT_TREE_FILENAME);
          
          // Check if output_tree.json exists
          let hasOutputTree = false;
          try {
            await fs.access(outputTreePath);
            hasOutputTree = true;
          } catch {
            // File doesn't exist
            hasOutputTree = false;
          }
          
          documents.push({
            id: entry.name,
            name: entry.name,
            path: docPath,
            hasOutputTree,
          });
        }
      }
      
      return documents;
    } catch (error) {
      console.error('Error reading documents directory:', error);
      throw new Error('Failed to read documents directory');
    }
  }

  /**
   * Check if user has access to a document
   */
  async checkAccess(documentId: string, userGroupIds: ObjectId[]): Promise<boolean> {
    return await DocumentModel.hasAccess(documentId, userGroupIds);
  }

  /**
   * Get a specific document's output_tree.json
   * Requires user to have permission
   */
  async getDocumentById(documentId: string, userGroupIds: ObjectId[]): Promise<DocumentStructure> {
    try {
      // Check permissions first
      const hasAccess = await this.checkAccess(documentId, userGroupIds);
      if (!hasAccess) {
        throw new Error('Access denied: You do not have permission to view this document');
      }

      const outputTreePath = path.join(OUTPUTS_DIR, documentId, OUTPUT_TREE_FILENAME);
      
      // Check if the file exists
      try {
        await fs.access(outputTreePath);
      } catch {
        throw new Error(`Document with id "${documentId}" not found or missing output_tree.json`);
      }
      
      // Read and parse the JSON file
      const fileContent = await fs.readFile(outputTreePath, 'utf-8');
      const documentStructure: DocumentStructure = JSON.parse(fileContent);
      
      return documentStructure;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      console.error('Error reading document:', error);
      throw new Error('Failed to read document');
    }
  }

  /**
   * Check if a document exists
   */
  async documentExists(documentId: string): Promise<boolean> {
    try {
      const docPath = path.join(OUTPUTS_DIR, documentId);
      const stats = await fs.stat(docPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Get all images for a specific document
   * Requires user to have permission
   */
  async getDocumentImages(documentId: string, userGroupIds: ObjectId[]): Promise<string[]> {
    try {
      // Check permissions first
      const hasAccess = await this.checkAccess(documentId, userGroupIds);
      if (!hasAccess) {
        throw new Error('Access denied: You do not have permission to view this document');
      }

      const docPath = path.join(OUTPUTS_DIR, documentId);
      
      // Check if the directory exists
      try {
        await fs.access(docPath);
      } catch {
        throw new Error(`Document with id "${documentId}" not found`);
      }
      
      const entries = await fs.readdir(docPath, { withFileTypes: true });
      
      // Filter for image files (jpeg, jpg, png)
      const images = entries
        .filter(entry => {
          if (!entry.isFile()) return false;
          const ext = path.extname(entry.name).toLowerCase();
          return ['.jpeg', '.jpg', '.png'].includes(ext);
        })
        .map(entry => entry.name)
        .sort(); // Sort alphabetically
      
      return images;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      console.error('Error reading document images:', error);
      throw new Error('Failed to read document images');
    }
  }

}

export const documentService = new DocumentService();
