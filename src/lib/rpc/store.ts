// Server-only JSON file store. Replaces Supabase for enquiries, page overrides,
// site settings and admin sessions. Everything lives in data/admin-store.json
// next to the project root. Imported only from server-function handlers (via a
// dynamic import), so node:fs never reaches the client bundle.
import type { AdminArticle } from "@/lib/articles";
import type { SafeUser } from "@/lib/auth";
import type { Enquiry } from "@/lib/enquiries";
import type { PageOverride } from "@/lib/page-overrides";
import type { SiteSettings } from "@/lib/site-settings";

/** A stored admin account. `passwordHash` is "scrypt:<saltHex>:<hashHex>". */
export type AdminUser = SafeUser & { passwordHash: string };
export type AdminSession = {
  token: string;
  userId: string;
  createdAt: string;
  expires: number;
};
export type LoginAttempt = { count: number; until: number };
export type AuditEntry = {
  id: string;
  at: string;
  email: string;
  action: string;
  detail?: string;
};

export type StoreShape = {
  enquiries: Enquiry[];
  overrides: Record<string, PageOverride>;
  settings: SiteSettings | null;
  articles: AdminArticle[];
  users: AdminUser[];
  sessions: AdminSession[];
  loginAttempts: Record<string, LoginAttempt>;
  audit: AuditEntry[];
};

const EMPTY: StoreShape = {
  enquiries: [],
  overrides: {},
  settings: null,
  articles: [],
  users: [],
  sessions: [],
  loginAttempts: {},
  audit: [],
};

const AUDIT_LIMIT = 500;

/** Appends an entry to the activity log, newest first, capped at AUDIT_LIMIT. */
export function recordAudit(
  store: StoreShape,
  entry: { email: string; action: string; detail?: string },
): void {
  store.audit.unshift({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    email: entry.email,
    action: entry.action,
    ...(entry.detail ? { detail: entry.detail } : {}),
  });
  if (store.audit.length > AUDIT_LIMIT) store.audit.length = AUDIT_LIMIT;
}

let cache: StoreShape | null = null;
let writeChain: Promise<unknown> = Promise.resolve();

async function filePath(): Promise<string> {
  const { join, isAbsolute } = await import("node:path");
  // ADMIN_DATA_DIR lets you point the store at a persistent volume or a separate
  // environment; defaults to ./data next to the project.
  const dir = process.env["ADMIN_DATA_DIR"]?.trim();
  const base = dir
    ? isAbsolute(dir)
      ? dir
      : join(process.cwd(), dir)
    : join(process.cwd(), "data");
  return join(base, "admin-store.json");
}

function normalize(parsed: Partial<StoreShape>): StoreShape {
  return {
    enquiries: Array.isArray(parsed.enquiries) ? parsed.enquiries : [],
    overrides:
      parsed.overrides && typeof parsed.overrides === "object"
        ? parsed.overrides
        : {},
    settings: parsed.settings ?? null,
    articles: Array.isArray(parsed.articles) ? parsed.articles : [],
    users: Array.isArray(parsed.users) ? parsed.users : [],
    // Sessions are dropped unless they carry the current (user-bound) shape.
    sessions: Array.isArray(parsed.sessions)
      ? parsed.sessions.filter(
          (s): s is AdminSession =>
            !!s && typeof s.token === "string" && typeof s.userId === "string",
        )
      : [],
    loginAttempts:
      parsed.loginAttempts && typeof parsed.loginAttempts === "object"
        ? parsed.loginAttempts
        : {},
    audit: Array.isArray(parsed.audit) ? parsed.audit : [],
  };
}

/** Reads the store from disk once, then serves a process-level cache. Never throws. */
export async function readStore(): Promise<StoreShape> {
  if (cache) return cache;
  try {
    const fs = await import("node:fs/promises");
    const raw = await fs.readFile(await filePath(), "utf8");
    cache = normalize(JSON.parse(raw) as Partial<StoreShape>);
  } catch {
    cache = { ...EMPTY };
  }
  return cache;
}

/**
 * Applies `fn` to the store and persists the result. Writes are serialized so two
 * concurrent mutations can never clobber each other. Returns whatever `fn` returns.
 */
export async function mutate<T>(
  fn: (store: StoreShape) => T | Promise<T>,
): Promise<T> {
  const run = writeChain.then(async () => {
    const store = await readStore();
    const result = await fn(store);
    cache = store;
    const fs = await import("node:fs/promises");
    const { dirname } = await import("node:path");
    const path = await filePath();
    await fs.mkdir(dirname(path), { recursive: true });
    // Atomic write: a crash mid-write leaves the old file intact, never a half file.
    const tmp = `${path}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
    await fs.rename(tmp, path);
    return result;
  });
  writeChain = run.catch(() => undefined);
  return run;
}
