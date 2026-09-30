import { registerSession } from "./app";

export interface SessionUser {
  uuid: string;
  userName: string;
  permission: number;
}

// Seed an authenticated session and return headers + the token to put in ?token=.
export function asUser(
  u: SessionUser,
  opts: { tokenMismatch?: boolean } = {}
): { headers: Record<string, string>; session: any; token: string } {
  const token = "tok-" + Math.random().toString(36).slice(2);
  const session: any = {
    login: true,
    uuid: u.uuid,
    userName: u.userName,
    token,
    save() {},
    maxAge: -1,
    SESSION_REQ_TIMES: []
  };
  const { id } = registerSession(session);
  return {
    headers: {
      "x-test-session-id": id,
      "x-requested-with": "XMLHttpRequest"
    },
    session,
    token: opts.tokenMismatch ? "WRONG" : token
  };
}

export function asAdmin(overrides: Partial<SessionUser> = {}) {
  return asUser({ uuid: "admin-uuid", userName: "admin", permission: 10, ...overrides });
}

export function asApiKey(value = "APIKEYVALUE") {
  return { headers: { "x-request-api-key": value } };
}

export function asPublic() {
  return { headers: {}, session: null, token: "" };
}

export function tokenQuery(token: string): string {
  return `token=${encodeURIComponent(token)}`;
}
