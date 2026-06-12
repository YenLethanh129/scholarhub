import type { User } from "../models/User";

export interface ISessionService {
  getStoredToken(): string | null;
  getStoredUser(): User | null;
  getStoredRole(): string | null;
  isAuthenticated(): boolean;
  hasRole(role: string): boolean;
  hasAnyRole(roles: string[]): boolean;
  canAccessExplorer(): boolean;
  clearSession(): void;
  getAuthHeaders(): Record<string, string>;
}
