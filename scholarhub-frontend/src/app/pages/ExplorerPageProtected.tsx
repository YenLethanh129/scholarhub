import { Navigate } from "react-router";
import { ExplorerPage } from "./ExplorerPage";
import { SessionService } from "../services/SessionService";

/**
 * Wrapper component for ExplorerPage with role-based access control
 * Only ADMIN and TEACHER can access the explorer
 * STUDENT users will be redirected to 404 page
 */
const sessionService = new SessionService();

export function ExplorerPageProtected() {
  if (!sessionService.canAccessExplorer()) {
    return <Navigate to="/error/404" replace />;
  }

  return <ExplorerPage />;
}
