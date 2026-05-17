export class Material {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description?: string,
    public readonly minioObjectName?: string,
    public readonly type?: string,
    public readonly status?: string,
    public readonly downloadCount: number = 0,
    public readonly size: number = 0,
    public readonly createdAt?: string,
    public readonly owner?: { id: string; username?: string; fullName?: string; email?: string },
    public readonly folder?: { id: string; folderName?: string },
    public readonly tags?: string[],
    public readonly metadata?: string,
  ) {}

  get isVideo(): boolean {
    return (this.type || "").toLowerCase() === "video";
  }

  get isImage(): boolean {
    return (this.type || "").toLowerCase() === "image";
  }

  get isPdf(): boolean {
    return (this.type || "").toLowerCase() === "pdf";
  }

  get formattedSize(): string {
    if (!this.size || Number.isNaN(this.size)) return "\u2014";
    if (this.size < 1024) return `${this.size} B`;
    const kb = this.size / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
  }

  static fromJson(data: Record<string, any>): Material {
    return new Material(
      data.id,
      data.title,
      data.description,
      data.minioObjectName,
      data.type,
      data.status,
      data.downloadCount ?? 0,
      data.size ?? 0,
      data.createdAt,
      data.owner,
      data.folder,
      data.tags,
      data.metadata,
    );
  }
}

export class MaterialDocument {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly metadata?: string,
    public readonly tags?: string[],
    public readonly folderId?: string,
    public readonly ownerId?: string,
    public readonly type?: string,
    public readonly size?: number,
    public readonly minioObjectName?: string,
    public readonly description?: string,
    public readonly createdAt?: string,
  ) {}

  static fromJson(data: Record<string, any>): MaterialDocument {
    return new MaterialDocument(
      data.id,
      data.title,
      data.metadata,
      data.tags,
      data.folderId,
      data.ownerId,
      data.type,
      data.size,
      data.minioObjectName,
      data.description,
      data.createdAt,
    );
  }
}
