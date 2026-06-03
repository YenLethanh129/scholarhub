export class ApiConfigService {
  getApiBase(): string {
    const fromEnv = import.meta.env.VITE_API_BASE_URL;
    if (fromEnv != null && String(fromEnv).trim() !== "") {
      return String(fromEnv).replace(/\/$/, "");
    }
    return import.meta.env.DEV ? "/api/v1" : "http://100.120.16.113:8080/api/v1";
  }
}
