/**
 * Base URL API. Dev mặc định dùng proxy Vite (`/api/v1`) để cookie Set-Cookie cùng origin.
 * Production: đặt VITE_API_BASE_URL (vd. https://api.example.com/api/v1).
 */
export function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv != null && String(fromEnv).trim() !== "") {
    return String(fromEnv).replace(/\/$/, "");
  }
  return import.meta.env.DEV ? "/api/v1" : "http://100.120.16.113:8080/api/v1";
}
