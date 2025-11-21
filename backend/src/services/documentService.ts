import fs from 'fs/promises';
import path from 'path';
import { OUTPUTS_DIR, OUTPUT_TREE_FILENAME } from '../config/paths';
import { DocumentMetadata, DocumentStructure } from '../types/document';

/**
 * Service for handling document operations
 */
export class DocumentService {
  /**
   * Get all available documents from the outputs directory
   */
  async getAllDocuments(): Promise<DocumentMetadata[]> {
    try {
      const entries = await fs.readdir(OUTPUTS_DIR, { withFileTypes: true });
      
      const documents: DocumentMetadata[] = [];
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
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
   * Get a specific document's output_tree.json
   */
  async getDocumentById(documentId: string): Promise<DocumentStructure> {
    try {
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
}

export const documentService = new DocumentService();
