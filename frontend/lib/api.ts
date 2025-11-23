import axios from 'axios';
import { DocumentMetadata, DocumentStructure } from '@/types/document';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  error?: string;
  message?: string;
}

/**
 * Fetch all available documents
 */
export const getAllDocuments = async (): Promise<DocumentMetadata[]> => {
  const response = await apiClient.get<ApiResponse<DocumentMetadata[]>>('/api/documents');
  return response.data.data;
};

/**
 * Fetch a specific document's structure by ID
 */
export const getDocumentById = async (id: string): Promise<DocumentStructure> => {
  const response = await apiClient.get<ApiResponse<DocumentStructure>>(`/api/documents/${id}`);
  return response.data.data;
};

/**
 * Fetch list of images for a specific document
 */
export const getDocumentImages = async (id: string): Promise<string[]> => {
  const response = await apiClient.get<ApiResponse<string[]>>(`/api/documents/${id}/images`);
  return response.data.data;
};

/**
 * Get the URL for a specific image
 */
export const getImageUrl = (documentId: string, imageName: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
  return `${baseUrl}/images/${documentId}/${imageName}`;
};

export default apiClient;
