// TanStack Start server functions — the whole data layer, no external backend.
// Handlers run server-side only; they pull the file store and server-only helpers
// in via dynamic import so node:fs and request/cookie APIs never reach the client
// bundle. Admin access is an httpOnly session cookie tied to a stored user account.
import { createServerFn } from "@tanstack/react-start";
import type { AdminArticle } from "@/lib/articles";
import type { Role, SafeUser } from "@/lib/auth";
import type { Enquiry, EnquiryInput } from "@/lib/enquiries";
import type { OverridePatch, PageOverride } from "@/lib/page-overrides";
import type { SiteSettings } from "@/lib/site-settings";
import { hashPassword, hashToken, verifyPassword } from "./crypto";
import type { AdminUser, AuditEntry } from "./store";

const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const COOKIE = "lx_admin";
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const MIN_PASSWORD = 8;

function newToken(): string {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
}

// ---- Session cookie -----------------------------------------------------------

async function setSessionCookie(token: string): Promise<void> {
  const { setCookie } = await import("@tanstack/react-start/server");
  setCookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env["NODE_ENV"] === "production",
    maxAge: Math.floor(SESSION_MS / 1000),
  });
}

async function clearSessionCookie(): Promise<void> {
  const { deleteCookie } = await import("@tanstack/react-start/server");
  deleteCookie(COOKIE, { path: "/" });
}

async function rawSessionToken(): Promise<string | undefined> {
  const { getCookie } = await import("@tanstack/react-start/server");
  return getCookie(COOKIE) || undefined;
}

/** The signed-in user for this request, or null. */
async function currentUser(): Promise<AdminUser | null> {
  const raw = await rawSessionToken();
  if (!raw) return null;
  const hashed = await hashToken(raw);
  const { readStore } = await import("./store");
  const store = await readStore();
  const now = Date.now();
  const session = store.sessions.find(
    (s) => s.token === hashed && s.expires > now,
  );
  if (!session) return null;
  return store.users.find((u) => u.id === session.userId) ?? null;
}

function toSafe(user: AdminUser): SafeUser {
  const { passwordHash: _ignored, ...safe } = user;
  void _ignored;
  return safe;
}

// ---- Articles helpers ---------------------------------------------------------

const RESERVED_SLUGS = new Set<string>();
async function bundledSlugs(): Promise<Set<string>> {
  if (RESERVED_SLUGS.size === 0) {
    const { insightArticles } = await import("@/data/insights");
    for (const a of insightArticles) RESERVED_SLUGS.add(a.slug);
  }
  return RESERVED_SLUGS;
}

// ---- Public reads -------------------------------------------------------------

/** Settings, page overrides and published articles for SSR. Raw values; the client merges defaults. */
export const loadSiteData = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    settings: SiteSettings | null;
    overrides: Record<string, PageOverride>;
    articles: AdminArticle[];
  }> => {
    const { readStore } = await import("./store");
    const store = await readStore();
    return {
      settings: store.settings,
      overrides: store.overrides,
      articles: store.articles.filter((a) => a.published),
    };
  },
);

/** Stores a consultation enquiry and, if configured, POSTs it to the notification webhook. */
export const submitEnquiry = createServerFn({ method: "POST" })
  .validator((input: EnquiryInput) => input)
  .handler(async ({ data }): Promise<boolean> => {
    if (!data || !data.email || !data.first_name) return false;
    const { mutate, readStore } = await import("./store");
    const enquiry: Enquiry = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      status: "new",
      notes: null,
    };
    await mutate((store) => {
      store.enquiries.unshift(enquiry);
    });
    const webhook = (await readStore()).settings?.notifyWebhook?.trim();
    if (webhook && /^https?:\/\//i.test(webhook)) {
      try {
        await fetch(webhook, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ type: "new_enquiry", enquiry }),
          signal: AbortSignal.timeout(5000),
        });
      } catch {
        /* Notification is best-effort; the enquiry is already stored. */
      }
    }
    return true;
  });

// ---- Auth ---------------------------------------------------------------------

/** Setup / login state plus the current user. No auth required. */
export const authState = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    hasUsers: boolean;
    user: SafeUser | null;
    sessions: number;
  }> => {
    const { readStore } = await import("./store");
    const store = await readStore();
    const user = await currentUser();
    const now = Date.now();
    const sessions = user
      ? store.sessions.filter((s) => s.userId === user.id && s.expires > now)
          .length
      : 0;
    return {
      hasUsers: store.users.length > 0,
      user: user ? toSafe(user) : null,
      sessions,
    };
  },
);

/** Creates the first administrator (owner). Only works while no users exist. */
export const setupFirstAdmin = createServerFn({ method: "POST" })
  .validator(
    (input: { email: string; name: string; password: string }) => input,
  )
  .handler(
    async ({ data }): Promise<{ user: SafeUser } | { error: string }> => {
      const { readStore, mutate, recordAudit } = await import("./store");
      const store = await readStore();
      if (store.users.length > 0)
        return { error: "Setup already completed. Please sign in." };
      const email = (data.email || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return { error: "Enter a valid email address." };
      if ((data.password || "").length < MIN_PASSWORD)
        return {
          error: `Password must be at least ${MIN_PASSWORD} characters.`,
        };
      const name = (data.name || "").trim();
      const now = new Date().toISOString();
      const user: AdminUser = {
        id: crypto.randomUUID(),
        email,
        ...(name ? { name } : {}),
        role: "owner",
        createdAt: now,
        lastLoginAt: now,
        passwordHash: await hashPassword(data.password),
      };
      const raw = newToken();
      const hashed = await hashToken(raw);
      await mutate((s) => {
        s.users.push(user);
        s.sessions.push({
          token: hashed,
          userId: user.id,
          createdAt: now,
          expires: Date.now() + SESSION_MS,
        });
        recordAudit(s, {
          email,
          action: "setup",
          detail: "First owner created",
        });
      });
      await setSessionCookie(raw);
      return { user: toSafe(user) };
    },
  );

export const loginUser = createServerFn({ method: "POST" })
  .validator((input: { email: string; password: string }) => input)
  .handler(
    async ({ data }): Promise<{ user: SafeUser } | { error: string }> => {
      const email = (data.email || "").trim().toLowerCase();
      const { readStore, mutate, recordAudit } = await import("./store");
      const store = await readStore();
      const now = Date.now();
      const attempt = store.loginAttempts[email];
      if (attempt && attempt.until > now) {
        const mins = Math.ceil((attempt.until - now) / 60000);
        return {
          error: `Too many attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`,
        };
      }
      const user = store.users.find((u) => u.email === email);
      const ok = user
        ? await verifyPassword(data.password || "", user.passwordHash)
        : false;
      if (!user || !ok) {
        await mutate((s) => {
          const a = s.loginAttempts[email] ?? { count: 0, until: 0 };
          a.count += 1;
          if (a.count >= MAX_ATTEMPTS) {
            a.until = Date.now() + LOCK_MS;
            a.count = 0;
          }
          s.loginAttempts[email] = a;
          recordAudit(s, { email, action: "login.failed" });
        });
        return { error: "Incorrect email or password." };
      }
      const raw = newToken();
      const hashed = await hashToken(raw);
      await mutate((s) => {
        delete s.loginAttempts[email];
        s.sessions = s.sessions.filter((x) => x.expires > now);
        s.sessions.push({
          token: hashed,
          userId: user.id,
          createdAt: new Date().toISOString(),
          expires: now + SESSION_MS,
        });
        const u = s.users.find((x) => x.id === user.id);
        if (u) u.lastLoginAt = new Date().toISOString();
        recordAudit(s, { email, action: "login" });
      });
      await setSessionCookie(raw);
      return { user: toSafe(user) };
    },
  );

export const logoutUser = createServerFn({ method: "POST" }).handler(
  async (): Promise<boolean> => {
    const raw = await rawSessionToken();
    if (raw) {
      const hashed = await hashToken(raw);
      const { mutate } = await import("./store");
      await mutate((s) => {
        s.sessions = s.sessions.filter((x) => x.token !== hashed);
      });
    }
    await clearSessionCookie();
    return true;
  },
);

export const logoutEverywhere = createServerFn({ method: "POST" }).handler(
  async (): Promise<boolean> => {
    const user = await currentUser();
    if (user) {
      const { mutate } = await import("./store");
      await mutate((s) => {
        s.sessions = s.sessions.filter((x) => x.userId !== user.id);
      });
    }
    await clearSessionCookie();
    return true;
  },
);

export const changeOwnPassword = createServerFn({ method: "POST" })
  .validator((input: { current: string; next: string }) => input)
  .handler(async ({ data }): Promise<string | null> => {
    const user = await currentUser();
    if (!user) return "You are signed out.";
    if (!(await verifyPassword(data.current || "", user.passwordHash)))
      return "Current password is incorrect.";
    if ((data.next || "").length < MIN_PASSWORD)
      return `New password must be at least ${MIN_PASSWORD} characters.`;
    const hash = await hashPassword(data.next);
    const { mutate, recordAudit } = await import("./store");
    return mutate((s) => {
      const u = s.users.find((x) => x.id === user.id);
      if (u) u.passwordHash = hash;
      recordAudit(s, { email: user.email, action: "password.change" });
      return null;
    });
  });

// ---- Admin: users (owner only) ------------------------------------------------

export const listAdminUsers = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ rows: SafeUser[]; error: string | null }> => {
    const user = await currentUser();
    if (!user) return { rows: [], error: "You are signed out." };
    if (user.role !== "owner")
      return { rows: [], error: "Only owners can manage users." };
    const { readStore } = await import("./store");
    const store = await readStore();
    return {
      rows: store.users
        .map(toSafe)
        .sort((a, b) => a.email.localeCompare(b.email)),
      error: null,
    };
  },
);

export const createAdminUser = createServerFn({ method: "POST" })
  .validator(
    (input: { email: string; name: string; role: Role; password: string }) =>
      input,
  )
  .handler(async ({ data }): Promise<string | null> => {
    const owner = await currentUser();
    if (!owner) return "You are signed out.";
    if (owner.role !== "owner") return "Only owners can add users.";
    const email = (data.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Enter a valid email address.";
    if ((data.password || "").length < MIN_PASSWORD)
      return `Password must be at least ${MIN_PASSWORD} characters.`;
    const role: Role = data.role === "owner" ? "owner" : "editor";
    const name = (data.name || "").trim();
    const passwordHash = await hashPassword(data.password);
    const { mutate, recordAudit } = await import("./store");
    return mutate((s) => {
      if (s.users.some((u) => u.email === email))
        return "A user with that email already exists.";
      s.users.push({
        id: crypto.randomUUID(),
        email,
        ...(name ? { name } : {}),
        role,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
        passwordHash,
      });
      recordAudit(s, {
        email: owner.email,
        action: "user.create",
        detail: `${email} (${role})`,
      });
      return null;
    });
  });

export const deleteAdminUser = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }): Promise<string | null> => {
    const owner = await currentUser();
    if (!owner) return "You are signed out.";
    if (owner.role !== "owner") return "Only owners can remove users.";
    if (owner.id === data.id) return "You cannot delete your own account.";
    const { mutate, recordAudit } = await import("./store");
    return mutate((s) => {
      const target = s.users.find((u) => u.id === data.id);
      if (!target) return "User not found.";
      if (
        target.role === "owner" &&
        s.users.filter((u) => u.role === "owner").length <= 1
      )
        return "Cannot remove the last owner.";
      s.users = s.users.filter((u) => u.id !== data.id);
      s.sessions = s.sessions.filter((x) => x.userId !== data.id);
      recordAudit(s, {
        email: owner.email,
        action: "user.delete",
        detail: target.email,
      });
      return null;
    });
  });

export const setAdminUserRole = createServerFn({ method: "POST" })
  .validator((input: { id: string; role: Role }) => input)
  .handler(async ({ data }): Promise<string | null> => {
    const owner = await currentUser();
    if (!owner) return "You are signed out.";
    if (owner.role !== "owner") return "Only owners can change roles.";
    const role: Role = data.role === "owner" ? "owner" : "editor";
    const { mutate, recordAudit } = await import("./store");
    return mutate((s) => {
      const target = s.users.find((u) => u.id === data.id);
      if (!target) return "User not found.";
      if (
        target.role === "owner" &&
        role !== "owner" &&
        s.users.filter((u) => u.role === "owner").length <= 1
      )
        return "Cannot demote the last owner.";
      target.role = role;
      recordAudit(s, {
        email: owner.email,
        action: "user.role",
        detail: `${target.email} → ${role}`,
      });
      return null;
    });
  });

/** Owner sets another user's password. Ends that user's sessions so the new one takes effect. */
export const adminResetUserPassword = createServerFn({ method: "POST" })
  .validator((input: { id: string; password: string }) => input)
  .handler(async ({ data }): Promise<string | null> => {
    const owner = await currentUser();
    if (!owner) return "You are signed out.";
    if (owner.role !== "owner") return "Only owners can reset passwords.";
    if ((data.password || "").length < MIN_PASSWORD)
      return `Password must be at least ${MIN_PASSWORD} characters.`;
    const hash = await hashPassword(data.password);
    const { mutate, recordAudit } = await import("./store");
    return mutate((s) => {
      const target = s.users.find((u) => u.id === data.id);
      if (!target) return "User not found.";
      target.passwordHash = hash;
      s.sessions = s.sessions.filter((x) => x.userId !== data.id);
      recordAudit(s, {
        email: owner.email,
        action: "user.password_reset",
        detail: target.email,
      });
      return null;
    });
  });

export const adminAuditLog = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ rows: AuditEntry[]; error: string | null }> => {
    const user = await currentUser();
    if (!user) return { rows: [], error: "You are signed out." };
    if (user.role !== "owner")
      return { rows: [], error: "Only owners can view the activity log." };
    const { readStore } = await import("./store");
    const store = await readStore();
    return { rows: store.audit.slice(0, 200), error: null };
  },
);

// ---- Admin: enquiries ---------------------------------------------------------

export const adminEnquiries = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ rows: Enquiry[]; error: string | null }> => {
    if (!(await currentUser()))
      return { rows: [], error: "You are signed out." };
    const { readStore } = await import("./store");
    const store = await readStore();
    const rows = [...store.enquiries].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    );
    return { rows, error: null };
  },
);

export const adminPatchEnquiry = createServerFn({ method: "POST" })
  .validator(
    (input: {
      id: string;
      patch: { status?: Enquiry["status"]; notes?: string | null };
    }) => input,
  )
  .handler(async ({ data }): Promise<string | null> => {
    if (!(await currentUser())) return "You are signed out.";
    const { mutate } = await import("./store");
    return mutate((store) => {
      const row = store.enquiries.find((e) => e.id === data.id);
      if (!row) return "Enquiry not found.";
      if (data.patch.status !== undefined) row.status = data.patch.status;
      if (data.patch.notes !== undefined) row.notes = data.patch.notes;
      return null;
    });
  });

export const adminDeleteEnquiry = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }): Promise<string | null> => {
    const user = await currentUser();
    if (!user) return "You are signed out.";
    const { mutate, recordAudit } = await import("./store");
    return mutate((store) => {
      store.enquiries = store.enquiries.filter((e) => e.id !== data.id);
      recordAudit(store, { email: user.email, action: "enquiry.delete" });
      return null;
    });
  });

// ---- Admin: content & settings ------------------------------------------------

export const adminPutOverride = createServerFn({ method: "POST" })
  .validator((input: { path: string; patch: OverridePatch }) => input)
  .handler(async ({ data }): Promise<string | null> => {
    const user = await currentUser();
    if (!user) return "You are signed out.";
    const { mutate, recordAudit } = await import("./store");
    return mutate((store) => {
      const prev = store.overrides[data.path];
      store.overrides[data.path] = {
        path: data.path,
        title: data.patch.title ?? prev?.title ?? null,
        description: data.patch.description ?? prev?.description ?? null,
        html: data.patch.html ?? prev?.html ?? null,
        updated_at: new Date().toISOString(),
      };
      recordAudit(store, {
        email: user.email,
        action: "page.edit",
        detail: data.path,
      });
      return null;
    });
  });

export const adminDeleteOverride = createServerFn({ method: "POST" })
  .validator((input: { path: string }) => input)
  .handler(async ({ data }): Promise<string | null> => {
    const user = await currentUser();
    if (!user) return "You are signed out.";
    const { mutate, recordAudit } = await import("./store");
    return mutate((store) => {
      delete store.overrides[data.path];
      recordAudit(store, {
        email: user.email,
        action: "page.reset",
        detail: data.path,
      });
      return null;
    });
  });

export const adminPutSettings = createServerFn({ method: "POST" })
  .validator((input: { settings: SiteSettings }) => input)
  .handler(async ({ data }): Promise<string | null> => {
    const user = await currentUser();
    if (!user) return "You are signed out.";
    const { mutate, recordAudit } = await import("./store");
    return mutate((store) => {
      store.settings = data.settings;
      recordAudit(store, { email: user.email, action: "settings.save" });
      return null;
    });
  });

// ---- Admin: articles ----------------------------------------------------------

export const adminListArticles = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ rows: AdminArticle[]; error: string | null }> => {
    if (!(await currentUser()))
      return { rows: [], error: "You are signed out." };
    const { readStore } = await import("./store");
    const store = await readStore();
    const rows = [...store.articles].sort((a, b) =>
      b.updated_at.localeCompare(a.updated_at),
    );
    return { rows, error: null };
  },
);

export const adminSaveArticle = createServerFn({ method: "POST" })
  .validator((input: { article: AdminArticle }) => input)
  .handler(async ({ data }): Promise<string | null> => {
    const user = await currentUser();
    if (!user) return "You are signed out.";
    const a = data.article;
    const slug = (a.slug || "").trim();
    if (!slug) return "A URL slug is required.";
    if (!/^[a-z0-9-]+$/.test(slug))
      return "Slug may only contain lowercase letters, numbers and hyphens.";
    if ((await bundledSlugs()).has(slug))
      return "That slug is used by a built-in article. Choose another.";
    if (!a.title.trim()) return "A title is required.";
    const article: AdminArticle = {
      ...a,
      slug,
      href: `/insights/${slug}/`,
      sections: a.sections
        .map((s) => ({
          heading: s.heading,
          paragraphs: s.paragraphs.filter((p) => p.trim().length > 0),
          points: (s.points ?? []).filter((p) => p.trim().length > 0),
        }))
        .filter((s) => s.heading.trim() || s.paragraphs.length),
      sources: a.sources.filter((s) => s.label.trim() && s.href.trim()),
      updated_at: new Date().toISOString(),
    };
    const { mutate, recordAudit } = await import("./store");
    return mutate((store) => {
      const i = store.articles.findIndex((x) => x.slug === slug);
      if (i >= 0) store.articles[i] = article;
      else store.articles.push(article);
      recordAudit(store, {
        email: user.email,
        action: article.published ? "article.publish" : "article.save",
        detail: article.title,
      });
      return null;
    });
  });

export const adminDeleteArticle = createServerFn({ method: "POST" })
  .validator((input: { slug: string }) => input)
  .handler(async ({ data }): Promise<string | null> => {
    const user = await currentUser();
    if (!user) return "You are signed out.";
    const { mutate, recordAudit } = await import("./store");
    return mutate((store) => {
      store.articles = store.articles.filter((a) => a.slug !== data.slug);
      recordAudit(store, {
        email: user.email,
        action: "article.delete",
        detail: data.slug,
      });
      return null;
    });
  });

// ---- Admin: media -------------------------------------------------------------

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

async function uploadsDir(): Promise<string> {
  const { join } = await import("node:path");
  return join(process.cwd(), "public", "uploads");
}

export const adminUploadImage = createServerFn({ method: "POST" })
  .validator((input: { filename: string; dataUrl: string }) => input)
  .handler(async ({ data }): Promise<{ url: string } | { error: string }> => {
    if (!(await currentUser())) return { error: "You are signed out." };
    const match = /^data:([^;]+);base64,(.+)$/s.exec(data.dataUrl ?? "");
    if (!match) return { error: "Unsupported image data." };
    const ext = MIME_EXT[match[1]!.toLowerCase()];
    if (!ext)
      return { error: "Only PNG, JPEG, WebP, GIF, AVIF or SVG are allowed." };
    const buffer = Buffer.from(match[2]!, "base64");
    if (buffer.byteLength > 6 * 1024 * 1024)
      return { error: "Image is larger than 6 MB." };
    const base =
      (data.filename || "image")
        .toLowerCase()
        .replace(/\.[a-z0-9]+$/, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "image";
    const name = `${base}-${Date.now().toString(36)}.${ext}`;
    const fs = await import("node:fs/promises");
    const { join } = await import("node:path");
    const dir = await uploadsDir();
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(join(dir, name), buffer);
    return { url: `/uploads/${name}` };
  });

export const adminListMedia = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    rows: { name: string; url: string; size: number; modified: string }[];
    error: string | null;
  }> => {
    if (!(await currentUser()))
      return { rows: [], error: "You are signed out." };
    const fs = await import("node:fs/promises");
    const { join } = await import("node:path");
    const dir = await uploadsDir();
    try {
      const names = (await fs.readdir(dir)).filter((n) => !n.startsWith("."));
      const rows = await Promise.all(
        names.map(async (name) => {
          const st = await fs.stat(join(dir, name));
          return {
            name,
            url: `/uploads/${name}`,
            size: st.size,
            modified: st.mtime.toISOString(),
          };
        }),
      );
      rows.sort((a, b) => b.modified.localeCompare(a.modified));
      return { rows, error: null };
    } catch {
      return { rows: [], error: null };
    }
  },
);

export const adminDeleteMedia = createServerFn({ method: "POST" })
  .validator((input: { name: string }) => input)
  .handler(async ({ data }): Promise<string | null> => {
    const user = await currentUser();
    if (!user) return "You are signed out.";
    const name = data.name || "";
    if (!/^[A-Za-z0-9._-]+$/.test(name) || name.includes(".."))
      return "Invalid file name.";
    const fs = await import("node:fs/promises");
    const { join } = await import("node:path");
    try {
      await fs.unlink(join(await uploadsDir(), name));
    } catch {
      return "Could not delete the file.";
    }
    const { mutate, recordAudit } = await import("./store");
    await mutate((s) =>
      recordAudit(s, {
        email: user.email,
        action: "media.delete",
        detail: name,
      }),
    );
    return null;
  });
