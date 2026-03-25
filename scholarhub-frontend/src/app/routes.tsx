import { createBrowserRouter } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { ExplorerPageProtected } from "./pages/ExplorerPageProtected";
import { MediaViewerPage } from "./pages/MediaViewerPage";
import { SearchResultsPage } from "./pages/SearchResultsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import { BadRequestPage } from "./pages/BadRequestPage";
import { ServerErrorPage } from "./pages/ServerErrorPage";
import { ServiceUnavailablePage } from "./pages/ServiceUnavailablePage";
import { RootLayout } from "./layouts/RootLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: LoginPage },
      { path: "explorer", Component: ExplorerPageProtected },
      { path: "viewer/:fileId", Component: MediaViewerPage },
      { path: "search", Component: SearchResultsPage },
      { path: "error/400", Component: BadRequestPage },
      { path: "error/401", Component: UnauthorizedPage },
      { path: "error/403", Component: ForbiddenPage },
      { path: "error/404", Component: NotFoundPage },
      { path: "error/500", Component: ServerErrorPage },
      { path: "error/503", Component: ServiceUnavailablePage },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
