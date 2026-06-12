export class SearchQuery {
  constructor(
    public readonly keyword?: string | null,
    public readonly type?: string,
    public readonly minSize?: number,
    public readonly maxSize?: number,
    public readonly fromDate?: string,
    public readonly toDate?: string,
    public readonly page: number = 0,
    public readonly size: number = 100,
  ) {}

  toQueryString(): string {
    const sp = new URLSearchParams();
    const kw = this.keyword?.trim();
    if (kw) sp.set("keyword", kw);
    if (this.type) sp.set("type", this.type);
    if (this.minSize != null) sp.set("minSize", String(this.minSize));
    if (this.maxSize != null) sp.set("maxSize", String(this.maxSize));
    if (this.fromDate) sp.set("fromDate", this.fromDate);
    if (this.toDate) sp.set("toDate", this.toDate);
    sp.set("page", String(this.page));
    sp.set("size", String(this.size));
    return sp.toString();
  }
}
