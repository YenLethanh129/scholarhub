import { ReactNode } from "react";
import { Navigate } from "react-router";
import { canAccessExplorer } from "../api/session";

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
  if (requiredRole === "explorer" && !canAccessExplorer()) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}
