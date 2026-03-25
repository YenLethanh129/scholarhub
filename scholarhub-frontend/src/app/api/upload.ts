import { getApiBase } from "./config";
import type { BaseResponse } from "./types";

/**
 * Upload resumable theo flow index.html: init → presigned-urls → PUT chunks → complete.
 */

export interface InitUploadRequest {
  fileName: string;
  fileSize: number;
  contentType: string;
  folderID?: string | null;
}

export interface InitUploadResponse {
  uploadId: string;
  objectKey: string;
}

export interface UploadStatusResponse {
  uploadId: string;
  objectKey: string;
  uploadedParts: Array<{ partNumber: number; eTag: string }>;
}

export interface CompleteUploadRequest {
  uploadId: string;
  objectKey: string;
  title: string;
  description?: string;
  folderId?: string;
  parts: Array<{ partNumber: number; eTag: string; etag?: string }>;
}

export interface MaterialResponse {
  id: string;
  title: string;
  description?: string;
  minioObjectName?: string;
  type?: string;
  status?: string;
  size?: number;
  createdAt?: string;
}

export async function initUpload(req: InitUploadRequest): Promise<InitUploadResponse> {
  const res = await fetch(`${getApiBase()}/materials/init-upload`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  const text = await res.text();
  let body: BaseResponse<InitUploadResponse> = { data: null };
  if (text) {
    try {
      body = JSON.parse(text) as BaseResponse<InitUploadResponse>;
    } catch {
      body = { message: text, data: null };
    }
  }

  if (!res.ok) {
    throw new Error(body.message || `Init upload thất bại (${res.status})`);
  }

  if (!body.data) throw new Error("Init upload response không có data");
  return body.data;
}

export async function getUploadStatus(uploadId: string, objectKey: string): Promise<UploadStatusResponse> {
  const url = `${getApiBase()}/materials/upload-status?uploadId=${encodeURIComponent(uploadId)}&objectKey=${encodeURIComponent(objectKey)}`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  const text = await res.text();
  let body: BaseResponse<UploadStatusResponse> = { data: null };
  if (text) {
    try {
      body = JSON.parse(text) as BaseResponse<UploadStatusResponse>;
    } catch {
      body = { message: text, data: null };
    }
  }

  if (!res.ok) {
    throw new Error(body.message || `Upload status thất bại (${res.status})`);
  }

  if (!body.data) throw new Error("Upload status response không có data");
  return body.data;
}

export async function getPresignedUrls(
  uploadId: string,
  objectKey: string,
  partNumbers: number[]
): Promise<Record<number, string>> {
  const parts = partNumbers.join(",");
  const url = `${getApiBase()}/materials/presigned-urls?uploadId=${encodeURIComponent(uploadId)}&objectKey=${encodeURIComponent(objectKey)}&partNumbers=${parts}`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  const text = await res.text();
  let body: BaseResponse<Record<number, string>> = { data: null };
  if (text) {
    try {
      body = JSON.parse(text) as BaseResponse<Record<number, string>>;
    } catch {
      body = { message: text, data: null };
    }
  }

  if (!res.ok) {
    throw new Error(body.message || `Lấy presigned URLs thất bại (${res.status})`);
  }

  if (!body.data) throw new Error("Presigned URLs response không có data");
  return body.data;
}

export async function completeUpload(req: CompleteUploadRequest): Promise<MaterialResponse> {
  const res = await fetch(`${getApiBase()}/materials/complete-upload`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  const text = await res.text();
  let body: BaseResponse<MaterialResponse> = { data: null };
  if (text) {
    try {
      body = JSON.parse(text) as BaseResponse<MaterialResponse>;
    } catch {
      body = { message: text, data: null };
    }
  }

  if (!res.ok) {
    throw new Error(body.message || `Complete upload thất bại (${res.status})`);
  }

  if (!body.data) throw new Error("Complete upload response không có data");
  return body.data;
}
