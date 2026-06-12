import type { Material } from "../models/Material";

export interface IMaterialService {
  getDetail(materialId: string): Promise<Material>;
  getDownloadUrl(materialId: string): Promise<string>;
  getViewUrl(materialId: string): Promise<string>;
  move(materialId: string, folderId: string): Promise<Material>;
  update(materialId: string, title?: string, description?: string | null): Promise<Material>;
  delete(materialId: string): Promise<void>;
}
