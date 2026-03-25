import { getApiBase } from "./config";
import type { BaseResponse, LoginDTO, LoginResponse } from "./types";
import { clearUserSession } from "./session";

/**
 * Kiểm tra xem JWT token có còn hạn sử dụng hay không
 * @param token JWT token string (format: header.payload.signature)
 * @returns true nếu token còn hạn, false nếu hết hạn hoặc không hợp lệ
 */
export function isTokenValid(token: string | null): boolean {
  if (!token) return false;

  try {
    // JWT format: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    // Decode payload (part 1)
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));

    // Kiểm tra exp claim (timestamp in seconds)
    const expiryTime = decoded.exp;
    if (!expiryTime) return false;

    // So sánh với thời gian hiện tại (tính bằng giây)
    const now = Math.floor(Date.now() / 1000);
    return expiryTime > now;
  } catch (e) {
    return false;
  }
}

/**
 * POST /auth/login — backend gắn session qua Set-Cookie, body data chứa user info.
 * API response: { code: 200, message: "...", data: { fullName: "...", role: "STUDENT|TEACHER|ADMIN" } }
 */
export async function login(credentials: LoginDTO): Promise<LoginResponse> {
  const apiUrl = `${getApiBase()}/auth/login`;

  const res = await fetch(apiUrl, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const text = await res.text();

  let body: BaseResponse<LoginResponse> = { data: null };
  if (text) {
    try {
      body = JSON.parse(text) as BaseResponse<LoginResponse>;
    } catch (e) {
      body = { message: text, data: null };
    }
  }

  if (!res.ok) {
    const errorMsg = body.message || `Đăng nhập thất bại (${res.status})`;
    throw new Error(errorMsg);
  }

  const userData = body.data;

  if (!userData) {
    throw new Error("Dữ liệu người dùng không được trả về từ server");
  }

  // Lưu token nếu backend trả trong header Authorization
  const authHeader = res.headers.get("Authorization");
  if (authHeader && authHeader.trim()) {
    localStorage.setItem("JWT_TOKENT", authHeader.trim());
  }

  // Lưu user data (fullName, role, email, id, etc.)

  localStorage.setItem("user_data", JSON.stringify(userData));

  return userData;
}

/**
 * Kiểm tra session/token còn hợp lệ hay không bằng cách gọi API
 * Sẽ gửi cookie cùng request, nếu token còn hạn backend trả user data
 * @returns user data nếu session hợp lệ, null nếu hết hạn hoặc lỗi
 */
export async function verifySessionToken(): Promise<LoginResponse | null> {
  try {
    const url = `${getApiBase()}/auth/check`;
    const res = await fetch(url, {
      method: "GET",
      credentials: "include", // Gửi cookie cùng request
      headers: { "Content-Type": "application/json" },
    });

    const text = await res.text();
    if (!text) {
      return null;
    }

    const body = JSON.parse(text) as BaseResponse<LoginResponse>;

    if (res.ok && body.data) {
      // Cập nhật user data từ server
      localStorage.setItem("user_data", JSON.stringify(body.data));
      return body.data;
    }

    if (res.status === 401) {
      clearUserSession();
      return null;
    }

    return null;
  } catch (error) {
    return null;
  }
}

export async function logout(): Promise<BaseResponse<null> | void> {
  // Backend bạn dùng `@PostMapping("/logout")` trong auth-controller.
  // Nên URL nhiều khả năng là `/auth/logout`. Để chắc chắn hơn, FE sẽ fallback sang `/logout`.
  const endpoints = [`${getApiBase()}/auth/logout`, `${getApiBase()}/logout`];
  let lastError: unknown = null;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
      });

      if (res.status === 404) continue;

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
        throw new Error(body.message || `Đăng xuất thất bại (${res.status})`);
      }

      // Clear user session after successful logout
      clearUserSession();

      return body;
    } catch (e) {
      lastError = e;
    }
  }

  // Attempt to clear session anyway if all endpoints failed
  clearUserSession();

  if (lastError instanceof Error) throw lastError;
}
