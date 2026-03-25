import { getApiBase } from "./config";
import type { BaseResponse, MaterialDocument } from "./types";
import { getAuthHeaders } from "./session";

export interface SearchQueryParams {
  /** Bỏ qua hoặc null/empty → không gửi param, backend trả toàn bộ (theo yêu cầu). */
  keyword?: string | null;
  type?: string;
  minSize?: number;
  maxSize?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

function buildSearchQueryString(params: SearchQueryParams): string {
  const sp = new URLSearchParams();
  const kw = params.keyword?.trim();
  if (kw) sp.set("keyword", kw);
  if (params.type) sp.set("type", params.type);
  if (params.minSize != null) sp.set("minSize", String(params.minSize));
  if (params.maxSize != null) sp.set("maxSize", String(params.maxSize));
  if (params.fromDate) sp.set("fromDate", params.fromDate);
  if (params.toDate) sp.set("toDate", params.toDate);
  sp.set("page", String(params.page ?? 0));
  sp.set("size", String(params.size ?? 100));
  return sp.toString();
}

/**
 * GET /search — cần cookie session sau login.
 */
export async function searchMaterials(params: SearchQueryParams = {}): Promise<MaterialDocument[]> {
  const qs = buildSearchQueryString(params);
  const res = await fetch(`${getApiBase()}/search?${qs}`, {
    method: "GET",
    credentials: "include",
    headers: {
      ...getAuthHeaders(),
    },
  });

  const text = await res.text();
  let body: BaseResponse<MaterialDocument[]> = { data: null };
  if (text) {
    try {
      body = JSON.parse(text) as BaseResponse<MaterialDocument[]>;
    } catch {
      body = { message: text, data: null };
    }
  }

  if (!res.ok) {
    const err = new Error(body.message || `Tìm kiếm thất bại (${res.status})`);
    (err as Error & { status: number }).status = res.status;
    throw err;
  }

  const data = body.data;
  return Array.isArray(data) ? data : [];
}
