export class RegisterRequest {
  constructor(
    public readonly username: string,
    public readonly email: string,
    public readonly password: string,
    public readonly fullName: string,
    public readonly role: string = "STUDENT",
  ) {}
}
