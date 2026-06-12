import type { IAuthService } from "../interfaces/IAuthService";
import { User } from "../models/User";
import type { LoginRequest } from "../models/LoginRequest";
import { ApiConfigService } from "./ApiConfigService";
import { SessionService } from "./SessionService";

export class AuthService implements IAuthService {
  constructor(
    private readonly apiConfig: ApiConfigService = new ApiConfigService(),
    private readonly session: SessionService = new SessionService(),
  ) {}

  isTokenValid(token: string | null): boolean {
    if (!token) return false;
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return false;
      const payload = parts[1];
      const decoded = JSON.parse(atob(payload));
      const expiryTime = decoded.exp;
      if (!expiryTime) return false;
      const now = Math.floor(Date.now() / 1000);
      return expiryTime > now;
    } catch {
      return false;
    }
  }

  async login(credentials: LoginRequest): Promise<User> {
    const apiUrl = `${this.apiConfig.getApiBase()}/auth/login`;
    const res = await fetch(apiUrl, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
    });

    if (!res.ok) {
      const text = await res.text();
      let message: string | undefined;
      try { message = JSON.parse(text).message; } catch { message = text; }
      throw new Error(message || `\u0110\u0103ng nh\u1eadp th\u1ea5t b\u1ea1i (${res.status})`);
    }

    const authHeader = res.headers.get("Authorization");
    if (authHeader && authHeader.trim()) {
      localStorage.setItem("JWT_TOKENT", authHeader.trim());
    }

    return await this.getCurrentUser();
  }

  async getCurrentUser(): Promise<User> {
    const url = `${this.apiConfig.getApiBase()}/auth/me`;
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...this.session.getAuthHeaders() },
    });

    if (!res.ok) throw new Error("Kh\u00f4ng th\u1ec3 l\u1ea5y th\u00f4ng tin ng\u01b0\u1eddi d\u00f9ng");

    const text = await res.text();
    const body = JSON.parse(text) as Record<string, any>;
    const role = body.data as string;

    if (!role) throw new Error("Kh\u00f4ng t\u00ecm th\u1ea5y vai tr\u00f2 ng\u01b0\u1eddi d\u00f9ng");

    const user = new User(undefined, "", role);
    localStorage.setItem("user_data", JSON.stringify(user.toJson()));
    return user;
  }

  async verifySession(): Promise<User | null> {
    try {
      const url = `${this.apiConfig.getApiBase()}/auth/check`;
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (res.status === 401) {
        this.session.clearSession();
        return null;
      }

      if (!res.ok) return null;

      return await this.getCurrentUser();
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    const endpoints = [
      `${this.apiConfig.getApiBase()}/auth/logout`,
      `${this.apiConfig.getApiBase()}/logout`,
    ];
    let lastError: unknown = null;

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: "POST",
          credentials: "include",
        });
        if (res.status === 404) continue;
        if (!res.ok) {
          const text = await res.text();
          let message: string | undefined;
          try { message = JSON.parse(text).message; } catch { message = text; }
          throw new Error(message || `\u0110\u0103ng xu\u1ea5t th\u1ea5t b\u1ea1i (${res.status})`);
        }
        this.session.clearSession();
        return;
      } catch (e) {
        lastError = e;
      }
    }

    this.session.clearSession();
    if (lastError instanceof Error) throw lastError;
  }
}
