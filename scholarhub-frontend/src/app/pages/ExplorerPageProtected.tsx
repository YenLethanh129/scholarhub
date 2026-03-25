import { Navigate } from "react-router";
import { ExplorerPage } from "./ExplorerPage";
import { canAccessExplorer } from "../api/session";

/**
 * Wrapper component for ExplorerPage with role-based access control
 * Only ADMIN and TEACHER can access the explorer
 * STUDENT users will be redirected to 404 page
 */
export function ExplorerPageProtected() {
  if (!canAccessExplorer()) {
    return <Navigate to="/error/404" replace />;
  }

  return <ExplorerPage />;
}
