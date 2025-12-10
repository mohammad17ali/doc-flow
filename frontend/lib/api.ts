import axios from 'axios';
import { DocumentMetadata, DocumentStructure } from '@/types/document';
import { LoginRequest, LoginResponse, User, UserGroup, DocumentPermission } from '@/types/auth';
import { BatchJob } from '@/types/batch';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002',
  timeout: 30000, // Increased to 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include session token
apiClient.interceptors.request.use(
  (config) => {
    // Get session token from localStorage
    if (typeof window !== 'undefined') {
      const sessionToken = localStorage.getItem('sessionToken');
      if (sessionToken) {
        config.headers.Authorization = `Bearer ${sessionToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on 401
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('user');
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// API response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
  message?: string;
}

/**
 * Fetch all available documents
 */
export const getAllDocuments = async (): Promise<DocumentMetadata[]> => {
  const response = await apiClient.get<ApiResponse<DocumentMetadata[]>>('/api/documents');
  return response.data.data || [];
};

/**
 * Fetch a specific document's structure by ID
 */
export const getDocumentById = async (id: string): Promise<DocumentStructure> => {
  const response = await apiClient.get<ApiResponse<DocumentStructure>>(`/api/documents/${id}`);
  return response.data.data!;
};

/**
 * Fetch list of images for a specific document
 */
export const getDocumentImages = async (id: string): Promise<string[]> => {
  const response = await apiClient.get<ApiResponse<string[]>>(`/api/documents/${id}/images`);
  return response.data.data || [];
};

/**
 * Get the URL for a specific image
 */
export const getImageUrl = (documentId: string, imageName: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
  return `${baseUrl}/images/${documentId}/${imageName}`;
};

/**
 * Get the URL for a specific PDF document
 */
export const getPdfUrl = (documentId: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
  return `${baseUrl}/pdfs/${documentId}.pdf`;
};

/**
 * Check if a document ID is a batch file ID
 * Batch file IDs follow the pattern: {batch_job_id}:{filename}
 * Examples: ALI10-1765274389.518018:pdf1.pdf, ALIX-1765262688.3141365:ts1.pdf
 * The pattern is: alphanumeric-timestamp:filename
 */
export const isBatchFileId = (documentId: string): boolean => {
  // Match pattern: {prefix}-{timestamp}:{filename}
  // where prefix is alphanumeric, timestamp is numeric with dots, and filename is anything
  return /^[A-Za-z0-9]+-[\d.]+:.+$/.test(documentId);
};

/**
 * Get the URL for a batch job file's PDF
 * Batch PDFs are served from: /api/batch_jobs/files/{fileId}/pdf
 */
export const getBatchFilePdfUrl = (fileId: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
  return `${baseUrl}/api/batch_jobs/files/${encodeURIComponent(fileId)}/pdf`;
};

/**
 * Fetch a batch job file's PDF as a blob (with authentication)
 * This is needed because react-pdf can't add auth headers to direct URL requests
 */
export const fetchBatchFilePdf = async (fileId: string): Promise<Blob> => {
  const response = await apiClient.get(
    `/api/batch_jobs/files/${encodeURIComponent(fileId)}/pdf`,
    { responseType: 'blob' }
  );
  return response.data;
};

/**
 * Get the document structure for a batch job file
 */
export const getBatchFileStructure = async (fileId: string): Promise<DocumentStructure> => {
  const response = await apiClient.get<ApiResponse<DocumentStructure>>(
    `/api/batch_jobs/files/${encodeURIComponent(fileId)}/structure`
  );
  return response.data.data!;
};

/**
 * Get the list of images for a batch job file
 */
export const getBatchFileImages = async (fileId: string): Promise<string[]> => {
  const response = await apiClient.get<ApiResponse<string[]>>(
    `/api/batch_jobs/files/${encodeURIComponent(fileId)}/images`
  );
  return response.data.data || [];
};

/**
 * Get the URL for a batch job file image
 */
export const getBatchFileImageUrl = (fileId: string, imageName: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
  return `${baseUrl}/api/batch_jobs/files/${encodeURIComponent(fileId)}/images/${encodeURIComponent(imageName)}`;
};

export const fetchBatchJobStatus = async (batchJobId: string): Promise<BatchJob> => {
  const response = await apiClient.get<ApiResponse<BatchJob>>(
    `/api/batch_jobs/${encodeURIComponent(batchJobId)}/status`
  )

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to retrieve batch job status')
  }

  return response.data.data
}

export const fetchBatchJobs = async (): Promise<BatchJob[]> => {
  const response = await apiClient.get<ApiResponse<BatchJob[]>>('/api/batch_jobs')

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to list batch jobs')
  }

  return response.data.data
}

// ============ AUTHENTICATION APIs ============

/**
 * Login with username and password
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
  return response.data;
};

/**
 * Logout current session
 */
export const logout = async (): Promise<void> => {
  await apiClient.post('/api/auth/logout');
};

/**
 * Get current authenticated user info
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<ApiResponse<User>>('/api/auth/me');
  return response.data.data!;
};

/**
 * Validate session token
 */
export const validateSession = async (sessionToken: string): Promise<User> => {
  const response = await apiClient.post<ApiResponse<User>>('/api/auth/validate', { sessionToken });
  return response.data.data!;
};

// ============ ADMIN APIs ============

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (activeOnly = false): Promise<User[]> => {
  const response = await apiClient.get<ApiResponse<User[]>>(`/api/admin/users?activeOnly=${activeOnly}`);
  return response.data.data!;
};

/**
 * Get all user groups (admin only)
 */
export const getAllUserGroups = async (activeOnly = false): Promise<UserGroup[]> => {
  const response = await apiClient.get<ApiResponse<UserGroup[]>>(`/api/admin/groups?activeOnly=${activeOnly}`);
  return response.data.data!;
};

/**
 * Get all documents with permissions (admin only)
 */
export const getAllDocumentsAdmin = async (): Promise<DocumentPermission[]> => {
  const response = await apiClient.get<ApiResponse<DocumentPermission[]>>('/api/admin/documents');
  return response.data.data!;
};

/**
 * Create a new user (admin only)
 */
export const createUser = async (userData: Partial<User> & { password: string }): Promise<string> => {
  const response = await apiClient.post<ApiResponse<{ userId: string }>>('/api/admin/users', userData);
  return response.data.data!.userId;
};

/**
 * Update a user (admin only)
 */
export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
  await apiClient.put(`/api/admin/users/${userId}`, updates);
};

/**
 * Delete a user (admin only)
 */
export const deleteUser = async (userId: string): Promise<void> => {
  await apiClient.delete(`/api/admin/users/${userId}`);
};

/**
 * Bulk delete users (admin only)
 */
export const bulkDeleteUsers = async (userIds: string[]): Promise<{ deletedCount: number }> => {
  const response = await apiClient.post<ApiResponse<{ deletedCount: number }>>('/api/admin/users/bulk-delete', { userIds });
  return response.data.data!;
};

/**
 * Create a new user group (admin only)
 */
export const createUserGroup = async (groupData: { name: string; description?: string }): Promise<string> => {
  const response = await apiClient.post<ApiResponse<{ groupId: string }>>('/api/admin/groups', groupData);
  return response.data.data!.groupId;
};

/**
 * Update a user group (admin only)
 */
export const updateUserGroup = async (groupId: string, updates: { name?: string; description?: string }): Promise<void> => {
  await apiClient.put(`/api/admin/groups/${groupId}`, updates);
};

/**
 * Delete a user group (admin only)
 */
export const deleteUserGroup = async (groupId: string): Promise<void> => {
  await apiClient.delete(`/api/admin/groups/${groupId}`);
};

/**
 * Bulk delete user groups (admin only)
 */
export const bulkDeleteUserGroups = async (groupIds: string[]): Promise<{ deletedCount: number }> => {
  const response = await apiClient.post<ApiResponse<{ deletedCount: number }>>('/api/admin/groups/bulk-delete', { groupIds });
  return response.data.data!;
};

/**
 * Add user to group (admin only)
 */
export const addUserToGroup = async (userId: string, groupId: string): Promise<void> => {
  await apiClient.post(`/api/admin/users/${userId}/groups/${groupId}`);
};

/**
 * Remove user from group (admin only)
 */
export const removeUserFromGroup = async (userId: string, groupId: string): Promise<void> => {
  await apiClient.delete(`/api/admin/users/${userId}/groups/${groupId}`);
};

/**
 * Add permission to document (admin only)
 */
export const addDocumentPermission = async (documentId: string, groupId: string): Promise<void> => {
  await apiClient.post(`/api/admin/documents/${documentId}/permissions`, { groupId });
};

/**
 * Remove permission from document (admin only)
 */
export const removeDocumentPermission = async (documentId: string, groupId: string): Promise<void> => {
  await apiClient.delete(`/api/admin/documents/${documentId}/permissions/${groupId}`);
};

/**
 * Update all permissions for a document (admin only)
 */
export const updateDocumentPermissions = async (documentId: string, permissions: { groupId: string }[]): Promise<void> => {
  await apiClient.put(`/api/admin/documents/${documentId}/permissions`, { permissions });
};

/**
 * Create a new document record (admin only)
 */
export const createDocument = async (documentData: { documentId: string; name?: string; description?: string }): Promise<string> => {
  const response = await apiClient.post<ApiResponse<{ documentId: string }>>('/api/admin/documents', documentData);
  return response.data.data!.documentId;
};

/**
 * Scan for new documents (admin only)
 */
export const scanDocuments = async (): Promise<{ availableFolders: string[]; newFolders: string[]; existingDocuments: string[] }> => {
  const response = await apiClient.get<ApiResponse<{ availableFolders: string[]; newFolders: string[]; existingDocuments: string[] }>>('/api/admin/documents/scan');
  return response.data.data!;
};

/**
 * Bulk delete documents (admin only)
 */
export const bulkDeleteDocuments = async (documentIds: string[]): Promise<{ deletedCount: number }> => {
  const response = await apiClient.post<ApiResponse<{ deletedCount: number }>>('/api/admin/documents/bulk-delete', { documentIds });
  return response.data.data!;
};

export default apiClient;
