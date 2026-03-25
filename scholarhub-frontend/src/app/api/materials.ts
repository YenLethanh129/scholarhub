import { getApiBase } from "./config";
import type { BaseResponse, MaterialResponse } from "./types";

export interface MaterialDetail {
  id: string;
  title: string;
  description?: string;
  minioObjectName?: string;
  type?: string;
  status?: string;
  downloadCount?: number;
  size?: number;
  createdAt?: string;
  tags?: string[];
  metadata?: string;
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

export async function getMaterialDetail(
  materialId: string,
): Promise<MaterialDetail> {
  const res = await fetch(`${getApiBase()}/materials/${materialId}`, {
    method: "GET",
    credentials: "include",
  });

  const text = await res.text();
  let body: BaseResponse<MaterialDetail> = { data: null };
  if (text) {
    try {
      body = JSON.parse(text) as BaseResponse<MaterialDetail>;
    } catch {
      body = { message: text, data: null };
    }
  }

  if (!res.ok) {
    throw new Error(
      body.message || `Lấy thông tin material thất bại (${res.status})`,
    );
  }

  if (!body.data) throw new Error("Material detail response không có data");
  return body.data;
}

export async function getDownloadUrl(materialId: string): Promise<string> {
  const res = await fetch(`${getApiBase()}/materials/${materialId}/download`, {
    method: "GET",
    credentials: "include",
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Lấy download URL thất bại (${res.status})`);
  }

  // Backend trả về {code, message, data: {downloadUrl, expiresIn, materialId}}
  try {
    const json = JSON.parse(text);
    if (json.data && typeof json.data === "object" && json.data.downloadUrl) {
      return json.data.downloadUrl;
    }
    if (json.data && typeof json.data === "string") {
      return json.data;
    }
    if (json.url) return json.url;
    throw new Error("Download URL không tìm thấy trong response");
  } catch (e) {
    if (
      e instanceof Error &&
      e.message.includes("Download URL không tìm thấy")
    ) {
      throw e;
    }
    throw new Error(
      `Lỗi parse download URL: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

export async function getViewUrl(materialId: string): Promise<string> {
  const res = await fetch(`${getApiBase()}/materials/${materialId}/view-url`, {
    method: "GET",
    credentials: "include",
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Lấy view URL thất bại (${res.status})`);
  }

  // Backend trả về {code, message, data: "http://..."}  (direct URL string)
  try {
    const json = JSON.parse(text);
    if (json.data && typeof json.data === "string") {
      return json.data;
    }
    if (json.data && typeof json.data === "object" && json.data.viewUrl) {
      return json.data.viewUrl;
    }
    if (json.url) return json.url;
    throw new Error("View URL không tìm thấy trong response");
  } catch (e) {
    if (e instanceof Error && e.message.includes("View URL không tìm thấy")) {
      throw e;
    }
    throw new Error(
      `Lỗi parse view URL: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

/**
 * Move material to a different folder
 * @param materialId - Material ID to move
 * @param folderId - Target folder ID (UUID string)
 * @returns MaterialResponse with updated folder information
 */
export async function moveMaterial(
  materialId: string,
  folderId: string,
): Promise<MaterialResponse> {
  const res = await fetch(`${getApiBase()}/materials/${materialId}/move`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(folderId),
    credentials: "include",
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
    throw new Error(
      body.message || `Di chuyển material thất bại (${res.status})`,
    );
  }

  if (!body.data) throw new Error("Move material response không có data");
  return body.data;
}

/**
 * Update material metadata (title and/or description)
 * @param materialId - Material ID to update
 * @param title - New title (optional)
 * @param description - New description (optional, null to clear)
 * @returns MaterialResponse with updated information
 */
export async function updateMaterial(
  materialId: string,
  title?: string,
  description?: string | null,
): Promise<MaterialResponse> {
  const payload: Record<string, any> = {};
  if (title !== undefined) payload.title = title;
  if (description !== undefined) payload.description = description;

  const res = await fetch(
    `${getApiBase()}/materials/${materialId}/update-material`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    },
  );

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
    throw new Error(
      body.message || `Cập nhật material thất bại (${res.status})`,
    );
  }

  if (!body.data) throw new Error("Update material response không có data");
  return body.data;
}

/**
 * Delete a material (file)
 * @param materialId - Material ID to delete
 */
export async function deleteMaterial(materialId: string): Promise<void> {
  const res = await fetch(`${getApiBase()}/materials/${materialId}`, {
    method: "DELETE",
    credentials: "include",
  });

  const text = await res.text();
  let body: BaseResponse<null> = { data: null };
  if (text) {
    try {
      body = JSON.parse(text) as BaseResponse<null>;
    } catch {
      body = { message: text, data: null };
    }
  }

  if (!res.ok) {
    throw new Error(body.message || `Xóa material thất bại (${res.status})`);
  }
}
