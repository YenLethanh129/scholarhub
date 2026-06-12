import type { IUploadService } from "../interfaces/IUploadService";
import type { InitUploadRequest, InitUploadResponse, UploadStatusResponse, CompleteUploadRequest } from "../models/Upload";
import { Material } from "../models/Material";
import { ApiConfigService } from "./ApiConfigService";

export class UploadService implements IUploadService {
  constructor(
    private readonly apiConfig: ApiConfigService = new ApiConfigService(),
  ) {}

  async initUpload(req: InitUploadRequest): Promise<InitUploadResponse> {
    const res = await fetch(`${this.apiConfig.getApiBase()}/materials/init-upload`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    const text = await res.text();
    let body: Record<string, any> = { data: null };
    if (text) { try { body = JSON.parse(text); } catch { body = { message: text, data: null }; } }
    if (!res.ok) throw new Error(body.message || `Init upload th\u1ea5t b\u1ea1i (${res.status})`);
    if (!body.data) throw new Error("Init upload response kh\u00f4ng c\u00f3 data");
    return body.data as InitUploadResponse;
  }

  async getStatus(uploadId: string, objectKey: string): Promise<UploadStatusResponse> {
    const url = `${this.apiConfig.getApiBase()}/materials/upload-status?uploadId=${encodeURIComponent(uploadId)}&objectKey=${encodeURIComponent(objectKey)}`;
    const res = await fetch(url, { method: "GET", credentials: "include" });
    const text = await res.text();
    let body: Record<string, any> = { data: null };
    if (text) { try { body = JSON.parse(text); } catch { body = { message: text, data: null }; } }
    if (!res.ok) throw new Error(body.message || `Upload status th\u1ea5t b\u1ea1i (${res.status})`);
    if (!body.data) throw new Error("Upload status response kh\u00f4ng c\u00f3 data");
    return body.data as UploadStatusResponse;
  }

  async getPresignedUrls(uploadId: string, objectKey: string, partNumbers: number[]): Promise<Record<number, string>> {
    const parts = partNumbers.join(",");
    const url = `${this.apiConfig.getApiBase()}/materials/presigned-urls?uploadId=${encodeURIComponent(uploadId)}&objectKey=${encodeURIComponent(objectKey)}&partNumbers=${parts}`;
    const res = await fetch(url, { method: "GET", credentials: "include" });
    const text = await res.text();
    let body: Record<string, any> = { data: null };
    if (text) { try { body = JSON.parse(text); } catch { body = { message: text, data: null }; } }
    if (!res.ok) throw new Error(body.message || `L\u1ea5y presigned URLs th\u1ea5t b\u1ea1i (${res.status})`);
    if (!body.data) throw new Error("Presigned URLs response kh\u00f4ng c\u00f3 data");
    return body.data as Record<number, string>;
  }

  async completeUpload(req: CompleteUploadRequest): Promise<Material> {
    const res = await fetch(`${this.apiConfig.getApiBase()}/materials/complete-upload`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    const text = await res.text();
    let body: Record<string, any> = { data: null };
    if (text) { try { body = JSON.parse(text); } catch { body = { message: text, data: null }; } }
    if (!res.ok) throw new Error(body.message || `Complete upload th\u1ea5t b\u1ea1i (${res.status})`);
    if (!body.data) throw new Error("Complete upload response kh\u00f4ng c\u00f3 data");
    return Material.fromJson(body.data);
  }
}
