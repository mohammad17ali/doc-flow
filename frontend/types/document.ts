/**
 * Type definitions for document structure
 * Matches the backend API response format
 */

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
