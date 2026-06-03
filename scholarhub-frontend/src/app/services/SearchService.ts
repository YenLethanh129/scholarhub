import type { ISearchService } from "../interfaces/ISearchService";
import { MaterialDocument } from "../models/Material";
import type { SearchQuery } from "../models/SearchQuery";
import { ApiConfigService } from "./ApiConfigService";
import { SessionService } from "./SessionService";

export class SearchService implements ISearchService {
  constructor(
    private readonly apiConfig: ApiConfigService = new ApiConfigService(),
    private readonly session: SessionService = new SessionService(),
  ) {}

  async search(params: SearchQuery): Promise<MaterialDocument[]> {
    const qs = params.toQueryString();
    const res = await fetch(`${this.apiConfig.getApiBase()}/search?${qs}`, {
      method: "GET",
      credentials: "include",
      headers: { ...this.session.getAuthHeaders() },
    });
    const text = await res.text();
    let body: Record<string, any> = { data: null };
    if (text) { try { body = JSON.parse(text); } catch { body = { message: text, data: null }; } }
    if (!res.ok) {
      const err = new Error(body.message || `T\u00ecm ki\u1ebfm th\u1ea5t b\u1ea1i (${res.status})`);
      (err as any).status = res.status;
      throw err;
    }
    const data = body.data;
    return Array.isArray(data) ? data.map((d: Record<string, any>) => MaterialDocument.fromJson(d)) : [];
  }
}
