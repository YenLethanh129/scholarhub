/** Khớp BaseResponse backend (API.doc / Response.doc). */
export interface BaseResponse<T = unknown> {
  code?: number;
  message?: string;
  data?: T | null;
}

export interface LoginDTO {
  email: string;
  password: string;
}

/** User role enumeration */
export enum UserRole {
  STUDENT = "STUDENT",
  TEACHER = "TEACHER",
  ADMIN = "ADMIN",
}

/** User data returned from login API */
export interface UserData {
  fullName: string;
  role: UserRole | string;
  id?: string;
  email?: string;
  username?: string;
}

/** Login response data */
export interface LoginResponse {
  fullName: string;
  role: UserRole | string;
  id?: string;
  email?: string;
  username?: string;
}

/** Material Response from backend - corresponds to Response.doc MaterialResponse */
export interface MaterialResponse {
  id: string;
  title: string;
  description?: string;
  minioObjectName?: string;
  type?: string;
  status?: string;
  downloadCount: number;
  size: number;
  createdAt?: string;
  owner?: {
    id: string;
    username?: string;
    fullName?: string;
    email?: string;
  };
  folder?: {
    id: string;
    folderName?: string;
  };
}

/** Tài liệu tìm kiếm Elasticsearch (Response.doc — MaterialDocument). */
export interface MaterialDocument {
  id: string;
  title: string;
  metadata?: string;
  tags?: string[];
  folderId?: string;
  ownerId?: string;
  type?: string;
  size?: number;
  minioObjectName?: string;
  description?: string;
  createdAt?: string;
}
