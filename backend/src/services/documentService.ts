import fs from 'fs/promises';
import path from 'path';
import { ObjectId } from 'mongodb';
import { OUTPUTS_DIR, OUTPUT_TREE_FILENAME, BATCH_OUTPUTS_DIR } from '../config/paths';
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
  async getAllDocuments(userGroupIds: ObjectId[], isAdmin = false): Promise<DocumentMetadata[]> {
    try {
      // Get documents user has access to from database
      const accessibleDocs = isAdmin
        ? await DocumentModel.findAll()
        : await DocumentModel.findByGroupIds(userGroupIds);
      const accessibleDocIds = new Set(accessibleDocs.map(doc => doc.documentId));
      
      // Check if OUTPUTS_DIR exists before trying to read it
      try {
        await fs.access(OUTPUTS_DIR);
      } catch {
        // Directory doesn't exist, return empty list
        return [];
      }
      
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
  async getDocumentById(documentId: string, userGroupIds: ObjectId[], isAdmin = false): Promise<DocumentStructure> {
    try {
      if (this.isBatchDocument(documentId)) {
        return await this.getBatchDocumentStructure(documentId);
      }

      // Check permissions first
      if (!isAdmin) {
        const hasAccess = await this.checkAccess(documentId, userGroupIds);
        if (!hasAccess) {
          throw new Error('Access denied: You do not have permission to view this document');
        }
      }

      const outputTreePath = path.join(OUTPUTS_DIR, documentId, OUTPUT_TREE_FILENAME);
      // const outputTreePath = path.join(OUTPUTS_DIR, OUTPUT_TREE_FILENAME);
      
      // Check if the file exists
      try {
        await fs.access(outputTreePath);
      } catch {
        throw new Error(`Document with id "${documentId}" not found in path ${outputTreePath} or missing output_tree.json`);
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

  private isBatchDocument(documentId: string) {
    return documentId.includes(':');
  }

  private getBatchDocumentFolder(documentId: string) {
    return documentId.replace(':', '_');
  }

  async getBatchDocumentStructure(documentId: string): Promise<DocumentStructure> {
    const [batchJobId] = documentId.split(':');
    const batchFolder = this.getBatchDocumentFolder(documentId);
    const outputTreePath = path.join(
      BATCH_OUTPUTS_DIR,
      batchJobId,
      batchFolder,
      'output',
      'processing',
      'output_tree.json'
    );

    try {
      await fs.access(outputTreePath);
    } catch {
      throw new Error(`Batch document "${documentId}" not found at ${outputTreePath}`);
    }

    const fileContent = await fs.readFile(outputTreePath, 'utf-8');
    return JSON.parse(fileContent);
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
  async getDocumentImages(documentId: string, userGroupIds: ObjectId[], isAdmin = false): Promise<string[]> {
    try {
      // Check permissions first
      if (!isAdmin) {
        const hasAccess = await this.checkAccess(documentId, userGroupIds);
        if (!hasAccess) {
          throw new Error('Access denied: You do not have permission to view this document');
        }
      }

      // Check if this is a batch document (contains colon)
      if (this.isBatchDocument(documentId)) {
        return await this.getBatchDocumentImages(documentId);
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

  private async getBatchDocumentImages(documentId: string): Promise<string[]> {
    const [batchJobId] = documentId.split(':');
    const batchFolder = this.getBatchDocumentFolder(documentId);
    
    // Images could be in multiple locations - check the output folder
    const outputPath = path.join(
      BATCH_OUTPUTS_DIR,
      batchJobId,
      batchFolder,
      'output',
      'processing'
    );

    try {
      await fs.access(outputPath);
    } catch {
      throw new Error(`Batch document "${documentId}" not found at ${outputPath}`);
    }

    const entries = await fs.readdir(outputPath, { withFileTypes: true });
    
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
  }

}

export const documentService = new DocumentService();
