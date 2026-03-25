import { Outlet } from "react-router";
import { Toaster } from "../components/ui/sonner";

export function RootLayout() {
  return (
    <div className="min-h-screen">
      <Outlet />
      <Toaster />
    </div>
  );
}
