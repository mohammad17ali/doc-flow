/**
 * Type definitions for document structure
 * Matches the format from expected-doc-structure.json
 */

import { ObjectId } from 'mongodb';

export type ContentType = 'text' | 'table' | 'image';

export interface ContentItem {
  type: ContentType;
  content: string;
}

export interface DocumentNode {
  content: ContentItem[];
  children: Array<Record<string, DocumentNode>>;
}

export interface DocumentStructure {
  root: DocumentNode;
}

export interface DocumentMetadata {
  id: string;
  name: string;
  path: string;
  hasOutputTree: boolean;
}

/**
 * Document permission entry
 * Defines which user groups can access the document
 */
export interface DocumentPermission {
  groupId: ObjectId;
}

/**
 * Document record in database
 * Stores document metadata and access control information
 */
export interface Document {
  _id?: ObjectId;
  documentId: string;          // Folder name (e.g., "BMRA-Single-Server", "tender-split")
  name: string;                 // Display name
  description?: string;         // Optional description
  filePath: string;             // Full path to document directory
  permissions: DocumentPermission[]; // Array of group permissions (ACL)
  metadata?: {
    fileCount?: number;
    size?: number;
    tags?: string[];
    category?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: ObjectId;
}
