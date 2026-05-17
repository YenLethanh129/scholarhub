export class User {
  constructor(
    public readonly id: string | undefined,
    public readonly fullName: string,
    public readonly role: string,
    public readonly email?: string,
    public readonly username?: string,
  ) {}

  get isAdmin(): boolean {
    return this.role === "ADMIN";
  }

  get isTeacher(): boolean {
    return this.role === "TEACHER";
  }

  get isStudent(): boolean {
    return this.role === "STUDENT";
  }

  get canAccessExplorer(): boolean {
    return this.isAdmin || this.isTeacher;
  }

  static fromJson(data: Record<string, any>): User {
    return new User(
      data.id,
      data.fullName,
      data.role,
      data.email,
      data.username,
    );
  }

  toJson(): Record<string, any> {
    return {
      id: this.id,
      fullName: this.fullName,
      role: this.role,
      email: this.email,
      username: this.username,
    };
  }
}
