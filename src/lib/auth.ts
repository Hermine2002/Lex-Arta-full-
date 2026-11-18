// Client-facing auth: types and thin wrappers over the server functions. The
// session lives in an httpOnly cookie set by the server, so the browser never
// handles the token directly.
import {
  adminAuditLog,
  adminResetUserPassword,
  authState,
  changeOwnPassword,
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  loginUser,
  logoutEverywhere,
  logoutUser,
  setAdminUserRole,
  setupFirstAdmin,
} from "./rpc/functions";

export type Role = "owner" | "editor";
export type AuditEntry = {
  id: string;
  at: string;
  email: string;
  action: string;
  detail?: string;
};

export type SafeUser = {
  id: string;
  email: string;
  name?: string;
  role: Role;
  createdAt: string;
  lastLoginAt?: string | null;
};

/** What the sign-in screen needs: are there any admins yet, and who (if anyone) is signed in. */
export type AuthSnapshot = {
  hasUsers: boolean;
  user: SafeUser | null;
  sessions: number;
};

function message(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function getAuthSnapshot(): Promise<AuthSnapshot> {
  try {
    return await authState();
  } catch {
    return { hasUsers: true, user: null, sessions: 0 };
  }
}

export async function setupFirst(input: {
  email: string;
  name: string;
  password: string;
}): Promise<{ user: SafeUser } | { error: string }> {
  try {
    return await setupFirstAdmin({ data: input });
  } catch (error) {
    return { error: message(error) };
  }
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<{ user: SafeUser } | { error: string }> {
  try {
    return await loginUser({ data: input });
  } catch (error) {
    return { error: message(error) };
  }
}

export async function logout(): Promise<void> {
  try {
    await logoutUser();
  } catch {
    /* ignore */
  }
}

export async function signOutEverywhere(): Promise<string | null> {
  try {
    await logoutEverywhere();
    return null;
  } catch (error) {
    return message(error);
  }
}

export async function changePassword(
  current: string,
  next: string,
): Promise<string | null> {
  try {
    return await changeOwnPassword({ data: { current, next } });
  } catch (error) {
    return message(error);
  }
}

export async function listUsers(): Promise<{
  rows: SafeUser[];
  error: string | null;
}> {
  try {
    return await listAdminUsers();
  } catch (error) {
    return { rows: [], error: message(error) };
  }
}

export async function createUser(input: {
  email: string;
  name: string;
  role: Role;
  password: string;
}): Promise<string | null> {
  try {
    return await createAdminUser({ data: input });
  } catch (error) {
    return message(error);
  }
}

export async function deleteUser(id: string): Promise<string | null> {
  try {
    return await deleteAdminUser({ data: { id } });
  } catch (error) {
    return message(error);
  }
}

export async function setUserRole(
  id: string,
  role: Role,
): Promise<string | null> {
  try {
    return await setAdminUserRole({ data: { id, role } });
  } catch (error) {
    return message(error);
  }
}

export async function resetUserPassword(
  id: string,
  password: string,
): Promise<string | null> {
  try {
    return await adminResetUserPassword({ data: { id, password } });
  } catch (error) {
    return message(error);
  }
}

export async function auditLog(): Promise<{
  rows: AuditEntry[];
  error: string | null;
}> {
  try {
    return await adminAuditLog();
  } catch (error) {
    return { rows: [], error: message(error) };
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}
