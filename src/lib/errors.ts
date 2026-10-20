export class BookingConflictError extends Error {
  conflicts: Array<{ type: "booking" | "block"; label: string }>;

  constructor(message: string, conflicts: Array<{ type: "booking" | "block"; label: string }> = []) {
    super(message);
    this.name = "BookingConflictError";
    this.conflicts = conflicts;
  }
}

export class ValidationFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationFailedError";
  }
}
