export class InitUploadRequest {
  constructor(
    public readonly fileName: string,
    public readonly fileSize: number,
    public readonly contentType: string,
    public readonly folderID?: string | null,
  ) {}
}

export class InitUploadResponse {
  constructor(
    public readonly uploadId: string,
    public readonly objectKey: string,
  ) {}
}

export class UploadStatusResponse {
  constructor(
    public readonly uploadId: string,
    public readonly objectKey: string,
    public readonly uploadedParts: Array<{ partNumber: number; eTag: string }>,
  ) {}
}

export class CompleteUploadRequest {
  constructor(
    public readonly uploadId: string,
    public readonly objectKey: string,
    public readonly title: string,
    public readonly description: string | undefined,
    public readonly parts: Array<{ partNumber: number; eTag: string; etag?: string }>,
    public readonly folderId?: string,
  ) {}
}

export class PartETag {
  constructor(
    public readonly partNumber: number,
    public readonly eTag: string,
  ) {}
}
