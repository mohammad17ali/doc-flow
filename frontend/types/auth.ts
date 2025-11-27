export interface User {
  userId: string;
  username: string;
  email: string;
  fullName?: string;
  groups: string[];
  groupIds: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    sessionToken: string;
    user: User;
  };
}

export interface UserGroup {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  groupId: string;
}

export interface DocumentPermission {
  _id: string;
  documentId: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isActive: boolean;
}
