import type { InitUploadRequest, InitUploadResponse, UploadStatusResponse, CompleteUploadRequest } from "../models/Upload";
import type { Material } from "../models/Material";

export interface IUploadService {
  initUpload(req: InitUploadRequest): Promise<InitUploadResponse>;
  getStatus(uploadId: string, objectKey: string): Promise<UploadStatusResponse>;
  getPresignedUrls(uploadId: string, objectKey: string, partNumbers: number[]): Promise<Record<number, string>>;
  completeUpload(req: CompleteUploadRequest): Promise<Material>;
}
