export class FolderItem {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly children?: FolderItem[],
    public readonly files?: FileItem[],
  ) {}
}

export class FileItem {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: "pdf" | "docx" | "pptx" | "video" | "image" | "other",
    public readonly size?: string,
    public readonly modifiedDate?: string,
  ) {}
}
