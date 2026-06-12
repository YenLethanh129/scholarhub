import { ReactNode } from "react";
import { Navigate } from "react-router";
import { SessionService } from "../services/SessionService";

const sessionService = new SessionService();

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string | string[];
  fallbackPath?: string;
}

/**
 * Component to protect routes based on user role
 * Checks if user can access the route, otherwise redirects to fallback path
 */
export function ProtectedRoute({
  children,
  requiredRole,
  fallbackPath = "/error/404",
}: ProtectedRouteProps): ReactNode {
  // For explorer, check if user can access it (ADMIN or TEACHER only)
  if (requiredRole === "explorer" && !sessionService.canAccessExplorer()) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}
