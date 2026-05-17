import type { ISessionService } from "../interfaces/ISessionService";
import { User } from "../models/User";

export class SessionService implements ISessionService {
  private getTokenFromDocumentCookie(): string | null {
    const cookieStr = document.cookie;
    if (!cookieStr) return null;

    const cookies = cookieStr
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    const jwtLike = (v: string) => {
      const value = v.trim();
      if (!value) return false;
      if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(value))
        return true;
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

    for (const c of cookies) {
      const value = getValue(c);
      if (jwtLike(value)) return value;
    }

    return null;
  }

  getStoredToken(): string | null {
    const keys = ["access_token", "token", "jwt", "JWT_TOKENT"] as const;
    const fromCookie = this.getTokenFromDocumentCookie();
    if (fromCookie) return fromCookie;
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v && v.trim()) return v.trim();
    }
    return null;
  }

  getAuthHeaders(): Record<string, string> {
    const token = this.getStoredToken();
    if (!token) return {};
    const value = token.toLowerCase().startsWith("bearer ")
      ? token
      : `Bearer ${token}`;
    return { Authorization: value };
  }

  getStoredUser(): User | null {
    try {
      const userDataStr = localStorage.getItem("user_data");
      if (!userDataStr) return null;
      return User.fromJson(JSON.parse(userDataStr));
    } catch {
      return null;
    }
  }

  getStoredRole(): string | null {
    const user = this.getStoredUser();
    return user?.role || null;
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken() && !!this.getStoredUser();
  }

  hasRole(role: string): boolean {
    return this.getStoredRole() === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const userRole = this.getStoredRole();
    return roles.includes(userRole || "");
  }

  canAccessExplorer(): boolean {
    return this.hasAnyRole(["ADMIN", "TEACHER"]);
  }

  clearSession(): void {
    localStorage.removeItem("JWT_TOKENT");
    localStorage.removeItem("user_data");
  }
}
