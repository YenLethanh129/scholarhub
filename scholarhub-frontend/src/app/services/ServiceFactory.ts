import { AuthService } from "./AuthService";
import { SessionService } from "./SessionService";
import { FolderService } from "./FolderService";
import { MaterialService } from "./MaterialService";
import { SearchService } from "./SearchService";
import { UploadService } from "./UploadService";
import { ApiConfigService } from "./ApiConfigService";

export class ServiceFactory {
  private static apiConfig: ApiConfigService;
  private static sessionService: SessionService;
  private static authService: AuthService;
  private static folderService: FolderService;
  private static materialService: MaterialService;
  private static searchService: SearchService;
  private static uploadService: UploadService;

  static getApiConfig(): ApiConfigService {
    if (!this.apiConfig) this.apiConfig = new ApiConfigService();
    return this.apiConfig;
  }

  static getSessionService(): SessionService {
    if (!this.sessionService) this.sessionService = new SessionService();
    return this.sessionService;
  }

  static getAuthService(): AuthService {
    if (!this.authService) this.authService = new AuthService(this.getApiConfig(), this.getSessionService());
    return this.authService;
  }

  static getFolderService(): FolderService {
    if (!this.folderService) this.folderService = new FolderService(this.getApiConfig());
    return this.folderService;
  }

  static getMaterialService(): MaterialService {
    if (!this.materialService) this.materialService = new MaterialService(this.getApiConfig());
    return this.materialService;
  }

  static getSearchService(): SearchService {
    if (!this.searchService) this.searchService = new SearchService(this.getApiConfig(), this.getSessionService());
    return this.searchService;
  }

  static getUploadService(): UploadService {
    if (!this.uploadService) this.uploadService = new UploadService(this.getApiConfig());
    return this.uploadService;
  }
}
