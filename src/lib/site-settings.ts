import { groups as sharedGroups } from "@/data/site-shared";
import type { AdminArticle } from "./articles";
import type { PageOverride } from "./page-overrides";
import { adminPutSettings, loadSiteData } from "./rpc/functions";

export type NavLink = { label: string; href: string };
export type NavGroup = NavLink & { links: NavLink[] };
export type ContactSettings = {
  companyName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  companyNumber: string;
  copyright: string;
};
export type SiteSettings = {
  socials: {
    instagram: string;
    facebook: string;
    linkedin: string;
    telegram: string;
    whatsapp: string;
  };
  theme: { primary: string; gold: string; ink: string };
  nav: NavGroup[] | null;
  contact: ContactSettings;
  /** URL to POST each new enquiry to (Slack/Make/Zapier/etc.). Empty = off. */
  notifyWebhook: string;
};

export const DEFAULT_SOCIALS = {
  instagram: "https://www.instagram.com/artlexconsult/",
  facebook: "",
  linkedin: "https://www.linkedin.com/company/108276536/",
  telegram: "https://t.me/+420607667076",
  whatsapp: "https://wa.me/420607667076",
};

export const DEFAULT_CONTACT: ContactSettings = {
  companyName: "Artlex Global LTD",
  email: "info@lexarta.co",
  phone: "",
  website: "https://lexarta.co",
  address:
    "Office 2036 Fitzrovia\n60 Tottenham Court Road\nLondon\nUnited Kingdom",
  companyNumber: "17479929",
  copyright: "© 2026 Artlex Global LTD. All rights reserved.",
};

export const defaultSettings: SiteSettings = {
  socials: { ...DEFAULT_SOCIALS },
  theme: { primary: "", gold: "", ink: "" },
  nav: null,
  contact: { ...DEFAULT_CONTACT },
  notifyWebhook: "",
};

export const defaultNav = sharedGroups;

/** Fills in any missing field with its default so the site always has a full object. */
export function mergeSettings(
  v: Partial<SiteSettings> | null | undefined,
): SiteSettings {
  if (!v) return defaultSettings;
  return {
    socials: { ...DEFAULT_SOCIALS, ...(v.socials ?? {}) },
    theme: { ...defaultSettings.theme, ...(v.theme ?? {}) },
    nav: Array.isArray(v.nav) ? v.nav : null,
    contact: { ...DEFAULT_CONTACT, ...(v.contact ?? {}) },
    notifyWebhook: typeof v.notifyWebhook === "string" ? v.notifyWebhook : "",
  };
}

/** Public read for SSR: settings (merged with defaults), page overrides and published articles. */
export async function fetchSiteData(): Promise<{
  settings: SiteSettings;
  overrides: Record<string, PageOverride>;
  articles: AdminArticle[];
}> {
  try {
    const raw = await loadSiteData();
    return {
      settings: mergeSettings(raw.settings),
      overrides: raw.overrides ?? {},
      articles: raw.articles ?? [],
    };
  } catch {
    return { settings: defaultSettings, overrides: {}, articles: [] };
  }
}

const HEX = /^#[0-9a-fA-F]{3,8}$/;
/** CSS variable overrides from the theme settings (validated, so no CSS injection is possible). */
export function themeCss(t: SiteSettings["theme"]): string {
  const rules: string[] = [];
  if (HEX.test(t.primary)) rules.push(`--primary:${t.primary}`);
  if (HEX.test(t.gold)) rules.push(`--gold:${t.gold}`);
  if (HEX.test(t.ink)) rules.push(`--ink-surface:${t.ink}`);
  return rules.length ? `:root{${rules.join(";")}}` : "";
}

/** Admin write. Returns an error message or null. */
export async function saveSettings(s: SiteSettings): Promise<string | null> {
  try {
    return await adminPutSettings({ data: { settings: s } });
  } catch (error) {
    return error instanceof Error ? error.message : "Something went wrong.";
  }
}
