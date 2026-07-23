import { formatRestError } from "../utils/restError";

export class SessionsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionsError";
  }
}

export function toSessionsError(error: unknown, fallback: string): SessionsError {
  return new SessionsError(formatRestError(error, fallback));
}
