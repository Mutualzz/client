import type { APIMeSession } from "@mutualzz/types";

export type { APIMeSession };

export interface SessionsRestHost {
  rest: {
    get<T>(path: string): Promise<T>;
    delete<T = unknown>(path: string): Promise<T>;
  };
}

export interface SessionRevokeResult {
  success: true;
}

export interface RevokeOtherSessionsResult {
  success: true;
  revoked: number;
}

export const ME_SESSIONS_QUERY_KEY = ["me-sessions"] as const;
