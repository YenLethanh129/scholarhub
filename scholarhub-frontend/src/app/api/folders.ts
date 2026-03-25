import { getApiBase } from "./config";
import type { BaseResponse } from "./types";
import type { FileItem, FolderItem } from "../components/FolderTree";

type BackendTreeNode = {
  id: string;
  name: string;
  children?: BackendTreeNode[];
};

type BackendFolderContent = {
  folders?: Array<{ id: string; name: string }>;
  materials?: Array<{
    id: string;
    title: string;
    description?: string;
    type?: string;
    size?: number;
    downloadCount?: number;
  }>;
};

function normalizeMaterialType(type?: string): FileItem["type"] {
  const t = (type || "").toLowerCase();
  if (t === "pdf") return "pdf";
  if (t === "docx" || t === "doc") return "docx";
  if (t === "pptx" || t === "ppt") return "pptx";
  if (t === "video") return "video";
  if (
    t === "image" ||
    t === "png" ||
    t === "jpg" ||
    t === "jpeg" ||
    t === "gif" ||
    t === "webp"
  )
    return "image";
  return "other";
}

function formatBytes(bytes?: number): string {
  if (bytes == null || Number.isNaN(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

function mapTreeNode(node: BackendTreeNode): FolderItem {
  return {
    id: node.id,
    name: node.name,
    children: node.children?.map(mapTreeNode),
  };
}

export async function getFolderTree(): Promise<FolderItem[]> {
  const res = await fetch(`${getApiBase()}/folders/tree`, {
    method: "GET",
    credentials: "include",
  });

  const text = await res.text();
  let body: BaseResponse<BackendTreeNode[]> = { data: null };
  if (text) {
    try {
      body = JSON.parse(text) as BaseResponse<BackendTreeNode[]>;
    } catch {
      body = { message: text, data: null };
    }
  }

  if (!res.ok) {
    const err = new Error(
      body.message || `Lấy folder tree thất bại (${res.status})`,
    );
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  const data = body.data;
  return Array.isArray(data) ? data.map(mapTreeNode) : [];
}

export async function getFolderContents(folderId: string): Promise<{
  folders: FolderItem[];
  files: FileItem[];
}> {
  const isRoot = folderId === "root";
  const url = isRoot
    ? `${getApiBase()}/folders/root/contents`
    : `${getApiBase()}/folders/${folderId}/contents`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  const text = await res.text();
  let body: BaseResponse<BackendFolderContent> = { data: null };
  if (text) {
    try {
      body = JSON.parse(text) as BaseResponse<BackendFolderContent>;
    } catch {
      body = { message: text, data: null };
    }
  }

  if (!res.ok) {
    const err = new Error(
      body.message || `Lấy nội dung folder thất bại (${res.status})`,
    );
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  const data = body.data;
  const folders: FolderItem[] = (data?.folders ?? []).map((f) => ({
    id: f.id,
    name: f.name,
  }));
  const files: FileItem[] = (data?.materials ?? []).map((m) => ({
    id: m.id,
    name: m.title,
    type: normalizeMaterialType(m.type),
    size: formatBytes(m.size),
  }));

  return { folders, files };
}

interface FolderRequestDTO {
  folderId?: string;
  folderName?: string;
  newFolderName?: string;
  parentFolderId?: string;
}

export async function createFolder(
  folderName: string,
  parentFolderId?: string | null,
): Promise<void> {
  const payload: FolderRequestDTO = { folderName };
  if (parentFolderId) payload.parentFolderId = parentFolderId;

  const res = await fetch(`${getApiBase()}/folders/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  const text = await res.text();
  let body: BaseResponse<unknown> = { data: null };
  if (text) {
    try {
      body = JSON.parse(text) as BaseResponse<unknown>;
    } catch {
      body = { message: text, data: null };
    }
  }

  if (!res.ok) {
    throw new Error(body.message || `Tạo folder thất bại (${res.status})`);
  }
}

export async function renameFolder(
  folderId: string,
  newFolderName: string,
): Promise<void> {
  const payload: FolderRequestDTO = { folderId, newFolderName };

  const res = await fetch(`${getApiBase()}/folders/rename`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  const text = await res.text();
  let body: BaseResponse<unknown> = { data: null };
  if (text) {
    try {
      body = JSON.parse(text) as BaseResponse<unknown>;
    } catch {
      body = { message: text, data: null };
    }
  }

  if (!res.ok) {
    throw new Error(body.message || `Đổi tên folder thất bại (${res.status})`);
  }
}

export async function moveFolder(
  folderId: string,
  parentFolderId: string,
): Promise<void> {
  const payload: FolderRequestDTO = { folderId, parentFolderId };

  const res = await fetch(`${getApiBase()}/folders/${folderId}/move`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  const text = await res.text();
  let body: BaseResponse<unknown> = { data: null };
  if (text) {
    try {
      body = JSON.parse(text) as BaseResponse<unknown>;
    } catch {
      body = { message: text, data: null };
    }
  }

  if (!res.ok) {
    throw new Error(
      body.message || `Di chuyển folder thất bại (${res.status})`,
    );
  }
}

export async function deleteFolder(folderId: string): Promise<void> {
  const payload: FolderRequestDTO = { folderId };

  const res = await fetch(`${getApiBase()}/folders/delete`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  const text = await res.text();
  let body: BaseResponse<unknown> = { data: null };
  if (text) {
    try {
      body = JSON.parse(text) as BaseResponse<unknown>;
    } catch {
      body = { message: text, data: null };
    }
  }

  if (!res.ok) {
    throw new Error(body.message || `Xóa folder thất bại (${res.status})`);
  }
}
