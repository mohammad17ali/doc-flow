import axios from 'axios';
import { DocumentMetadata, DocumentStructure } from '@/types/document';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
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

export default apiClient;
