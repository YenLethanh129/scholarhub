import type { User } from "../models/User";
import type { LoginRequest } from "../models/LoginRequest";

export interface IAuthService {
  login(credentials: LoginRequest): Promise<User>;
  logout(): Promise<void>;
  verifySession(): Promise<User | null>;
  isTokenValid(token: string | null): boolean;
  getCurrentUser(): Promise<User>;
}
