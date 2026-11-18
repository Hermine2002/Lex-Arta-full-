import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/articles";
import { isEmail } from "@/lib/auth";
import { recordAudit, type StoreShape } from "@/lib/rpc/store";
import { defaultSettings, mergeSettings } from "@/lib/site-settings";

function emptyStore(): StoreShape {
  return {
    enquiries: [],
    overrides: {},
    settings: null,
    articles: [],
    users: [],
    sessions: [],
    loginAttempts: {},
    audit: [],
  };
}

describe("recordAudit", () => {
  it("prepends newest-first and caps the log at 500", () => {
    const s = emptyStore();
    for (let i = 0; i < 600; i++) {
      recordAudit(s, { email: "a@b.co", action: "test", detail: String(i) });
    }
    expect(s.audit.length).toBe(500);
    expect(s.audit[0]?.detail).toBe("599");
    expect(s.audit[0]?.action).toBe("test");
  });
});

describe("mergeSettings", () => {
  it("fills every missing field with its default", () => {
    const merged = mergeSettings({
      socials: {
        instagram: "https://insta/x",
        facebook: "",
        linkedin: "",
        telegram: "",
        whatsapp: "",
      },
    });
    expect(merged.socials.instagram).toBe("https://insta/x");
    expect(merged.contact.email).toBe(defaultSettings.contact.email);
    expect(merged.notifyWebhook).toBe("");
  });

  it("returns full defaults for null", () => {
    expect(mergeSettings(null)).toEqual(defaultSettings);
  });
});

describe("slugify", () => {
  it("produces URL-safe slugs", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
    expect(slugify("  MiCA & CASP  ")).toBe("mica-casp");
    expect(slugify("EU AMLR 2027")).toBe("eu-amlr-2027");
  });
});

describe("isEmail", () => {
  it("accepts valid and rejects invalid addresses", () => {
    expect(isEmail("owner@lexarta.co")).toBe(true);
    expect(isEmail("not-an-email")).toBe(false);
    expect(isEmail("a@b")).toBe(false);
  });
});
