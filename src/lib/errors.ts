export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly validationIssues?: any
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
