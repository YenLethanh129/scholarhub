import type { IFolderService, FolderContent } from "../interfaces/IFolderService";
import type { FolderItem, FileItem } from "../models/Folder";
import { ApiConfigService } from "./ApiConfigService";

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

export class FolderService implements IFolderService {
  constructor(
    private readonly apiConfig: ApiConfigService = new ApiConfigService(),
  ) {}

  private normalizeMaterialType(type?: string): FileItem["type"] {
    const t = (type || "").toLowerCase();
    if (t === "pdf") return "pdf";
    if (t === "docx" || t === "doc") return "docx";
    if (t === "pptx" || t === "ppt") return "pptx";
    if (t === "video") return "video";
    if (t === "image" || t === "png" || t === "jpg" || t === "jpeg" || t === "gif" || t === "webp")
      return "image";
    return "other";
  }

  private formatBytes(bytes?: number): string {
    if (bytes == null || Number.isNaN(bytes)) return "\u2014";
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
  }

  private mapTreeNode(node: BackendTreeNode): FolderItem {
    return {
      id: node.id,
      name: node.name,
      children: node.children?.map((c) => this.mapTreeNode(c)),
    };
  }

  async getTree(): Promise<FolderItem[]> {
    const res = await fetch(`${this.apiConfig.getApiBase()}/folders/tree`, {
      method: "GET",
      credentials: "include",
    });
    const text = await res.text();
    let body: Record<string, any> = { data: null };
    if (text) {
      try { body = JSON.parse(text); } catch { body = { message: text, data: null }; }
    }
    if (!res.ok) {
      const err = new Error(body.message || `L\u1ea5y folder tree th\u1ea5t b\u1ea1i (${res.status})`);
      (err as any).status = res.status;
      throw err;
    }
    const data = body.data;
    return Array.isArray(data) ? data.map((n: BackendTreeNode) => this.mapTreeNode(n)) : [];
  }

  async getContents(folderId: string): Promise<FolderContent> {
    const isRoot = folderId === "root";
    const url = isRoot
      ? `${this.apiConfig.getApiBase()}/folders/root/contents`
      : `${this.apiConfig.getApiBase()}/folders/${folderId}/contents`;
    const res = await fetch(url, { method: "GET", credentials: "include" });
    const text = await res.text();
    let body: Record<string, any> = { data: null };
    if (text) {
      try { body = JSON.parse(text); } catch { body = { message: text, data: null }; }
    }
    if (!res.ok) {
      const err = new Error(body.message || `L\u1ea5y n\u1ed9i dung folder th\u1ea5t b\u1ea1i (${res.status})`);
      (err as any).status = res.status;
      throw err;
    }
    const data = body.data as BackendFolderContent | undefined;
    const folders: FolderItem[] = (data?.folders ?? []).map((f) => ({ id: f.id, name: f.name }));
    const files: FileItem[] = (data?.materials ?? []).map((m) => ({
      id: m.id,
      name: m.title,
      type: this.normalizeMaterialType(m.type),
      size: this.formatBytes(m.size),
    }));
    return { folders, files };
  }

  async create(name: string, parentFolderId?: string | null): Promise<void> {
    const payload: Record<string, string> = { folderName: name };
    if (parentFolderId) payload.parentFolderId = parentFolderId;
    const res = await fetch(`${this.apiConfig.getApiBase()}/folders/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    const text = await res.text();
    let body: Record<string, any> = { data: null };
    if (text) { try { body = JSON.parse(text); } catch { body = { message: text, data: null }; } }
    if (!res.ok) throw new Error(body.message || `T\u1ea1o folder th\u1ea5t b\u1ea1i (${res.status})`);
  }

  async rename(folderId: string, newName: string): Promise<void> {
    const payload = { folderId, newFolderName: newName };
    const res = await fetch(`${this.apiConfig.getApiBase()}/folders/rename`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    const text = await res.text();
    let body: Record<string, any> = { data: null };
    if (text) { try { body = JSON.parse(text); } catch { body = { message: text, data: null }; } }
    if (!res.ok) throw new Error(body.message || `\u0110\u1ed5i t\u00ean folder th\u1ea5t b\u1ea1i (${res.status})`);
  }

  async move(folderId: string, parentFolderId: string): Promise<void> {
    const payload = { folderId, parentFolderId };
    const res = await fetch(`${this.apiConfig.getApiBase()}/folders/${folderId}/move`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    const text = await res.text();
    let body: Record<string, any> = { data: null };
    if (text) { try { body = JSON.parse(text); } catch { body = { message: text, data: null }; } }
    if (!res.ok) throw new Error(body.message || `Di chuy\u1ec3n folder th\u1ea5t b\u1ea1i (${res.status})`);
  }

  async delete(folderId: string): Promise<void> {
    const payload = { folderId };
    const res = await fetch(`${this.apiConfig.getApiBase()}/folders/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    const text = await res.text();
    let body: Record<string, any> = { data: null };
    if (text) { try { body = JSON.parse(text); } catch { body = { message: text, data: null }; } }
    if (!res.ok) throw new Error(body.message || `X\u00f3a folder th\u1ea5t b\u1ea1i (${res.status})`);
  }
}
