export class ApiResponse<T = unknown> {
  constructor(
    public readonly code?: number,
    public readonly message?: string,
    public readonly data?: T | null,
  ) {}

  get isSuccess(): boolean {
    return this.code === 200 || this.code === undefined;
  }

  static fromJson<T>(json: Record<string, any>): ApiResponse<T> {
    return new ApiResponse<T>(
      json.code,
      json.message,
      json.data as T | null | undefined,
    );
  }
}
