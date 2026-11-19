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
/** Header and footer content that is not contact data. */
export type LayoutSettings = {
  logo: string;
  logoAlt: string;
  brandName: string;
  brandTagline: string;
  /** Main navigation. An item pointing at /services/ shows the services drop-down. */
  headerLinks: NavLink[];
  cta: NavLink;
  footerTagline: string;
  /** Footer introduction. "{company}" is replaced by the legal company name. */
  footerAbout: string;
  footerMarkets: string;
  footerCompanyTitle: string;
  footerCompany: NavLink[];
  footerLegalTitle: string;
  footerLegal: NavLink[];
  /** Small print under the copyright. "{company}" and "{number}" are filled in. */
  footerNote: string;
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
  layout: LayoutSettings;
  /** URL to POST each new enquiry to (Slack/Make/Zapier/etc.). Empty = off. */
  notifyWebhook: string;
};

export const DEFAULT_LAYOUT: LayoutSettings = {
  logo: "/images/lex-arta-logo.png",
  logoAlt: "LEX ARTA logo",
  brandName: "LEX ARTA",
  brandTagline: "LEGAL & COMPLIANCE",
  headerLinks: [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services/" },
    { label: "Insights", href: "/insights/" },
    { label: "About", href: "/about/" },
    { label: "Contact", href: "/contact/" },
  ],
  cta: { label: "Book a Consultation", href: "/book-a-consultation/" },
  footerTagline: "International legal, regulatory\n& compliance advisory",
  footerAbout:
    "LEX ARTA is a boutique international advisory brand operated by {company}, providing strategic legal, regulatory and compliance advice to regulated and cross-border businesses across jurisdictions.",
  footerMarkets: "LONDON / UNITED KINGDOM / INTERNATIONAL",
  footerCompanyTitle: "Company",
  footerCompany: [
    { label: "About", href: "/about/" },
    { label: "Expertise", href: "/services/" },
    { label: "Team", href: "/about/#team" },
    { label: "Insights", href: "/insights/" },
    { label: "Contact", href: "/contact/" },
  ],
  footerLegalTitle: "Legal",
  footerLegal: [
    { label: "Legal Notice", href: "/legal-notice/" },
    { label: "Terms of Use", href: "/terms/" },
    { label: "Terms of Business", href: "/terms-of-business/" },
    { label: "Privacy Notice", href: "/privacy/" },
    { label: "Cookie Policy", href: "/cookies/" },
    { label: "Disclaimer", href: "/disclaimer/" },
  ],
  footerNote:
    "LEX ARTA is a professional services brand owned by {company}. This website is operated by {company}{number}. Website content is general information only and does not constitute professional advice.",
};

const isLinkList = (v: unknown): v is NavLink[] =>
  Array.isArray(v) &&
  v.every(
    (l) =>
      l &&
      typeof l === "object" &&
      typeof (l as NavLink).label === "string" &&
      typeof (l as NavLink).href === "string",
  );

function mergeLayout(v: Partial<LayoutSettings> | undefined): LayoutSettings {
  const out: LayoutSettings = { ...DEFAULT_LAYOUT };
  if (!v || typeof v !== "object") return out;
  for (const key of Object.keys(DEFAULT_LAYOUT) as (keyof LayoutSettings)[]) {
    const value = v[key];
    const fallback = DEFAULT_LAYOUT[key];
    if (typeof fallback === "string" && typeof value === "string")
      (out as Record<string, unknown>)[key] = value;
    else if (Array.isArray(fallback) && isLinkList(value))
      (out as Record<string, unknown>)[key] = value;
  }
  const cta = v.cta;
  if (cta && typeof cta.label === "string" && typeof cta.href === "string")
    out.cta = { label: cta.label, href: cta.href };
  return out;
}

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
  layout: DEFAULT_LAYOUT,
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
    layout: mergeLayout(v.layout),
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
