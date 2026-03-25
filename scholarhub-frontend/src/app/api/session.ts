/**
 * Lấy token từ localStorage và chuẩn hoá sang header `Authorization`.
 *
 * Vì tài liệu hiện tại mô tả backend dùng cookie `Set-Cookie`, nhưng user yêu cầu
 * đính kèm `Authorization` cho các request cần token, nên chúng ta chỉ gửi
 * header khi trong localStorage có token.
 */
function getTokenFromDocumentCookie(): string | null {
  // Nếu cookie bị `HttpOnly` thì JS không đọc được, khi đó hàm này sẽ trả null.
  const cookieStr = document.cookie;
  if (!cookieStr) return null;

  const cookies = cookieStr
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  const jwtLike = (v: string) => {
    const value = v.trim();
    if (!value) return false;

    // JWT thường có 3 phần ngăn bởi dấu "."
    if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(value))
      return true;
    // Một số backend lưu dạng "Bearer <jwt>"
    if (
      /^Bearer\s+[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/i.test(value)
    )
      return true;
    return false;
  };

  const getValue = (cookie: string) => {
    const idx = cookie.indexOf("=");
    if (idx === -1) return "";
    return decodeURIComponent(cookie.slice(idx + 1));
  };

  // Ưu tiên các tên cookie hay gặp; nếu không khớp thì vẫn quét value theo pattern JWT.
  const preferredNames = [
    "Authorization",
    "authorization",
    "access_token",
    "accessToken",
    "token",
    "jwt",
    "JWT_TOKENT",
  ];

  for (const c of cookies) {
    const name = c.slice(0, c.indexOf("=")).trim();
    const value = getValue(c);
    if (!value) continue;

    if (preferredNames.includes(name) && jwtLike(value)) {
      return value;
    }
  }

  // fallback: quét tất cả cookie xem có value giống JWT không
  for (const c of cookies) {
    const value = getValue(c);
    if (jwtLike(value)) return value;
  }

  return null;
}

export function getStoredToken(): string | null {
  const keys = ["access_token", "token", "jwt", "JWT_TOKENT"] as const;

  const fromCookie = getTokenFromDocumentCookie();
  if (fromCookie) return fromCookie;

  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v && v.trim()) return v.trim();
  }
  return null;
}

export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (!token) return {};

  const value = token.toLowerCase().startsWith("bearer ")
    ? token
    : `Bearer ${token}`;
  return { Authorization: value };
}

/**
 * Get stored user data from localStorage
 */
export function getStoredUserData() {
  try {
    const userDataStr = localStorage.getItem("user_data");
    if (!userDataStr) return null;

    return JSON.parse(userDataStr) as {
      fullName: string;
      role: string;
      id?: string;
      email?: string;
      username?: string;
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get stored user role
 */
export function getStoredUserRole(): string | null {
  const userData = getStoredUserData();
  return userData?.role || null;
}

/**
 * Check if user is authenticated (has token and user data)
 */
export function isAuthenticated(): boolean {
  return !!getStoredToken() && !!getStoredUserData();
}

/**
 * Check if user has a specific role
 */
export function hasRole(role: string): boolean {
  const userRole = getStoredUserRole();
  return userRole === role;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(roles: string[]): boolean {
  const userRole = getStoredUserRole();
  return roles.includes(userRole || "");
}

/**
 * Check if user can access explorer (ADMIN or TEACHER)
 */
export function canAccessExplorer(): boolean {
  return hasAnyRole(["ADMIN", "TEACHER"]);
}

/**
 * Clear user session (logout)
 */
export function clearUserSession(): void {
  localStorage.removeItem("JWT_TOKENT");
  localStorage.removeItem("user_data");
}
