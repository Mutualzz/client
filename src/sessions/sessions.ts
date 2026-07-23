import type { APIMeSession } from "@mutualzz/types";

import { toSessionsError } from "./errors";
import type { SessionRevokeResult, SessionsRestHost, RevokeOtherSessionsResult } from "./types";

const SESSIONS_PATH = "/@me/sessions";

export async function fetchMeSessions(
  host: SessionsRestHost,
): Promise<APIMeSession[]> {
  try {
    return await host.rest.get<APIMeSession[]>(SESSIONS_PATH);
  } catch (error) {
    throw toSessionsError(error, "Could not load sessions");
  }
}

export async function revokeMeSession(
  host: SessionsRestHost,
  sessionId: string,
): Promise<SessionRevokeResult> {
  try {
    await host.rest.delete(`${SESSIONS_PATH}/${sessionId}`);
    return { success: true };
  } catch (error) {
    throw toSessionsError(error, "Could not revoke session");
  }
}

export async function revokeOtherMeSessions(
  host: SessionsRestHost,
): Promise<RevokeOtherSessionsResult> {
  try {
    return await host.rest.delete<RevokeOtherSessionsResult>(SESSIONS_PATH);
  } catch (error) {
    throw toSessionsError(error, "Could not log out other sessions");
  }
}
