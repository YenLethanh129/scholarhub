import type { IMaterialService } from "../interfaces/IMaterialService";
import { Material } from "../models/Material";
import { ApiConfigService } from "./ApiConfigService";

export class MaterialService implements IMaterialService {
  constructor(
    private readonly apiConfig: ApiConfigService = new ApiConfigService(),
  ) {}

  async getDetail(materialId: string): Promise<Material> {
    const res = await fetch(`${this.apiConfig.getApiBase()}/materials/${materialId}`, {
      method: "GET",
      credentials: "include",
    });
    const text = await res.text();
    let body: Record<string, any> = { data: null };
    if (text) { try { body = JSON.parse(text); } catch { body = { message: text, data: null }; } }
    if (!res.ok) throw new Error(body.message || `L\u1ea5y th\u00f4ng tin material th\u1ea5t b\u1ea1i (${res.status})`);
    if (!body.data) throw new Error("Material detail response kh\u00f4ng c\u00f3 data");
    return Material.fromJson(body.data);
  }

  async getDownloadUrl(materialId: string): Promise<string> {
    const res = await fetch(`${this.apiConfig.getApiBase()}/materials/${materialId}/download`, {
      method: "GET",
      credentials: "include",
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`L\u1ea5y download URL th\u1ea5t b\u1ea1i (${res.status})`);
    try {
      const json = JSON.parse(text);
      if (json.data && typeof json.data === "object" && json.data.downloadUrl) return json.data.downloadUrl;
      if (json.data && typeof json.data === "string") return json.data;
      if (json.url) return json.url;
      throw new Error("Download URL kh\u00f4ng t\u00ecm th\u1ea5y trong response");
    } catch (e) {
      if (e instanceof Error && e.message.includes("Download URL kh\u00f4ng t\u00ecm th\u1ea5y")) throw e;
      throw new Error(`L\u1ed7i parse download URL: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async getViewUrl(materialId: string): Promise<string> {
    const res = await fetch(`${this.apiConfig.getApiBase()}/materials/${materialId}/view-url`, {
      method: "GET",
      credentials: "include",
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`L\u1ea5y view URL th\u1ea5t b\u1ea1i (${res.status})`);
    try {
      const json = JSON.parse(text);
      if (json.data && typeof json.data === "string") return json.data;
      if (json.data && typeof json.data === "object" && json.data.viewUrl) return json.data.viewUrl;
      if (json.url) return json.url;
      throw new Error("View URL kh\u00f4ng t\u00ecm th\u1ea5y trong response");
    } catch (e) {
      if (e instanceof Error && e.message.includes("View URL kh\u00f4ng t\u00ecm th\u1ea5y")) throw e;
      throw new Error(`L\u1ed7i parse view URL: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async move(materialId: string, folderId: string): Promise<Material> {
    const res = await fetch(`${this.apiConfig.getApiBase()}/materials/${materialId}/move`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(folderId),
      credentials: "include",
    });
    const text = await res.text();
    let body: Record<string, any> = { data: null };
    if (text) { try { body = JSON.parse(text); } catch { body = { message: text, data: null }; } }
    if (!res.ok) throw new Error(body.message || `Di chuy\u1ec3n material th\u1ea5t b\u1ea1i (${res.status})`);
    if (!body.data) throw new Error("Move material response kh\u00f4ng c\u00f3 data");
    return Material.fromJson(body.data);
  }

  async update(materialId: string, title?: string, description?: string | null): Promise<Material> {
    const payload: Record<string, any> = {};
    if (title !== undefined) payload.title = title;
    if (description !== undefined) payload.description = description;
    const res = await fetch(`${this.apiConfig.getApiBase()}/materials/${materialId}/update-material`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    const text = await res.text();
    let body: Record<string, any> = { data: null };
    if (text) { try { body = JSON.parse(text); } catch { body = { message: text, data: null }; } }
    if (!res.ok) throw new Error(body.message || `C\u1eadp nh\u1eadt material th\u1ea5t b\u1ea1i (${res.status})`);
    if (!body.data) throw new Error("Update material response kh\u00f4ng c\u00f3 data");
    return Material.fromJson(body.data);
  }

  async delete(materialId: string): Promise<void> {
    const res = await fetch(`${this.apiConfig.getApiBase()}/materials/${materialId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const text = await res.text();
    let body: Record<string, any> = { data: null };
    if (text) { try { body = JSON.parse(text); } catch { body = { message: text, data: null }; } }
    if (!res.ok) throw new Error(body.message || `X\u00f3a material th\u1ea5t b\u1ea1i (${res.status})`);
  }
}
