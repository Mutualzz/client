import type { APIMeSession } from "@mutualzz/types";

export type { APIMeSession };

export type SessionsRestHost = {
  rest: {
    get<T>(path: string): Promise<T>;
    delete<T = unknown>(path: string): Promise<T>;
  };
};

export type SessionRevokeResult = {
  success: true;
};

export type RevokeOtherSessionsResult = {
  success: true;
  revoked: number;
};

export const ME_SESSIONS_QUERY_KEY = ["me-sessions"] as const;
