/* eslint-disable prettier/prettier */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, ChevronDown, Menu, X, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shared } from "@/data/site-shared";
import { resolveImageUrl } from "@/lib/assets";
import {
  DEFAULT_LAYOUT,
  type ContactSettings,
  type LayoutSettings,
  type NavGroup,
} from "@/lib/site-settings";

const isServicesLink = (href: string) =>
  href.replace(/\/+$/, "") === "/services";

function isActive(path: string, href: string): boolean {
  const clean = href.split("#")[0]!.split("?")[0]!;
  if (!clean.startsWith("/")) return false;
  if (clean === "/") return path === "/";
  const withSlash = clean.endsWith("/") ? clean : `${clean}/`;
  return isServicesLink(clean)
    ? path.startsWith(withSlash)
    : path === withSlash;
}

/** Fills the {company} and {number} placeholders used in footer texts. */
function fill(text: string, contact: ContactSettings): string {
  return text
    .split("{company}")
    .join(contact.companyName)
    .split("{number}")
    .join(
      contact.companyNumber
        ? `, registered in England and Wales under company number ${contact.companyNumber}`
        : "",
    );
}

export function SiteHeader({
  path,
  groups = shared.groups as NavGroup[],
  layout = DEFAULT_LAYOUT,
}: {
  path: string;
  groups?: NavGroup[] | undefined;
  layout?: LayoutSettings | undefined;
}) {
  const [menu, setMenu] = useState(false);
  const [services, setServices] = useState(false);
  const servicesNavRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setMenu(false);
    setServices(false);
  }, [path]);
  useEffect(() => {
    if (!services) return;
    function handleOutside(e: MouseEvent) {
      if (
        servicesNavRef.current &&
        !servicesNavRef.current.contains(e.target as Node)
      ) {
        setServices(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setServices(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [services]);
  return (
    <header className="site-header">
      <a href="/" className="brand" aria-label={`${layout.brandName} home`}>
        <span className="">
          <img
            alt={layout.logoAlt}
            loading="lazy"
            src={resolveImageUrl(layout.logo)}
          />
          <span />
        </span>
        <span className="brand-name">
          {layout.brandName}
          <small>{layout.brandTagline}</small>
        </span>
      </a>
      <nav
        className={menu ? "primary-nav mobile-open" : "primary-nav"}
        aria-label="Main navigation"
      >
        {layout.headerLinks.map((link, i) =>
          isServicesLink(link.href) ? (
            <div
              key={`${i}-${link.href}`}
              className="services-nav"
              ref={servicesNavRef}
            >
              <div className="services-nav-label">
                <a
                  href={link.href}
                  className={isActive(path, link.href) ? "active" : ""}
                  onClick={(e) => {
                    // In the open mobile menu, tapping "Services" opens the full
                    // list instead of leaving; "All services" in it still links there.
                    if (!menu) return;
                    e.preventDefault();
                    setServices((s) => !s);
                  }}
                >
                  {link.label}
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Show services"
                  aria-expanded={services}
                  onClick={() => setServices((s) => !s)}
                >
                  <ChevronDown size={12} />
                </Button>
              </div>
              {services && (
                <div className="mega-menu">
                  <a className="all-services" href="/services/">
                    All services <ArrowUpRight size={16} />
                  </a>
                  <div className="mega-grid">
                    {groups.map((group) => (
                      <div key={group.href}>
                        <a className="mega-heading" href={group.href}>
                          {group.label}
                        </a>
                        {group.links.map((link) => (
                          <a key={link.href} href={link.href}>
                            {link.label}
                          </a>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <a
              key={`${i}-${link.href}`}
              href={link.href}
              className={isActive(path, link.href) ? "active" : ""}
            >
              {link.label}
            </a>
          ),
        )}
        {layout.cta.label && (
          <a className="mobile-nav-cta" href={layout.cta.href}>
            {layout.cta.label} <ArrowUpRight size={16} />
          </a>
        )}
      </nav>
      {layout.cta.label && (
        <Button asChild className="header-cta" size="lg">
          <a href={layout.cta.href}>
            {layout.cta.label} <ArrowUpRight />
          </a>
        </Button>
      )}
      <Button
        className="mobile-toggle"
        size="icon"
        variant="ghost"
        aria-label={menu ? "Close navigation" : "Open navigation"}
        aria-expanded={menu}
        onClick={() => setMenu(!menu)}
      >
        {menu ? <X /> : <Menu />}
      </Button>
    </header>
  );
}

const FOOTER_SOCIALS: {
  key: string;
  label: string;
  icon: ReactNode;
}[] = [
  {
    key: "instagram",
    label: "Instagram",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect
          fill="none"
          height="18"
          rx="5"
          stroke="currentColor"
          strokeWidth="2"
          width="18"
          x="3"
          y="3"
        />
        <circle
          cx="12"
          cy="12"
          fill="none"
          r="4"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="17.5" cy="6.5" r="1.2" />
      </svg>
    ),
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M14.5 21v-8h2.8l.4-3h-3.2V8c0-.9.3-1.5 1.6-1.5H18V3.8c-.4-.1-1.4-.2-2.5-.2-2.8 0-4.6 1.7-4.6 4.8V10H8v3h2.9v8Z" />
      </svg>
    ),
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M4.4 8.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6ZM3 10h2.9v10H3Zm5 0h2.8v1.4c.4-.8 1.4-1.6 3-1.6 3.1 0 3.7 2 3.7 4.6V20h-2.9v-5c0-1.2 0-2.6-1.7-2.6-1.7 0-2 1.3-2 2.5V20H8Z" />
      </svg>
    ),
  },
  {
    key: "telegram",
    label: "Telegram",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M21.4 3.5 18.3 20c-.2 1.1-.8 1.4-1.7.9l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.4-5 9.2-8.3c.4-.4-.1-.6-.6-.3L6.1 13.6 1.4 12c-1-.3-1-1 .2-1.5L20 3.4c.9-.3 1.7.2 1.4 1.1Z" />
      </svg>
    ),
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 2a9.8 9.8 0 0 0-8.4 14.9L2 22l5.3-1.4A9.9 9.9 0 1 0 12 2Zm0 18a8 8 0 0 1-4-1.1l-.3-.2-3.1.8.8-3-.2-.3A8 8 0 1 1 12 20Zm4.5-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.4 6.4 0 0 1-1.9-1.2 7 7 0 0 1-1.3-1.6c-.1-.2 0-.4.1-.5l.4-.5.3-.4c.1-.1.1-.3 0-.4L9.9 8c-.1-.4-.3-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.2s1 2.5 1.1 2.7a9.7 9.7 0 0 0 3.7 3.3c1.9.8 1.9.5 2.3.5.7-.1 2-.8 2.3-1.5.3-.7.3-1.2.2-1.3-.1-.1-.2-.2-.4-.3Z" />
      </svg>
    ),
  },
];

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

/**
 * Site footer, rendered from structured settings (contact details + social links)
 * so it can be edited in the admin without touching HTML.
 */
export function SiteFooter({
  contact,
  socials,
  layout = DEFAULT_LAYOUT,
}: {
  contact: ContactSettings;
  socials?: Record<string, string> | undefined;
  layout?: LayoutSettings | undefined;
}) {
  const taglineLines = layout.footerTagline.split("\n");
  const markets = layout.footerMarkets
    .split("/")
    .map((m) => m.trim())
    .filter(Boolean);
  const addressLines = contact.address.split("\n").filter((l) => l.trim());
  const social = FOOTER_SOCIALS.map((s) => ({
    ...s,
    url: socials?.[s.key]?.trim() || "",
  })).filter((s) => s.url);

  return (
    <footer aria-label="Footer" className="lx-site-footer">
      <div className="lx-footer-shell">
        <div className="lx-footer-brand-column">
          <a className="lx-footer-brand" href="/">
            <img
              alt={layout.logoAlt}
              loading="lazy"
              src={resolveImageUrl(layout.logo)}
            />
            <span>
              <strong>{layout.brandName}</strong>
              <small>
                {taglineLines.map((line, i) => (
                  <span key={i}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))}
              </small>
            </span>
          </a>
          <span className="lx-footer-rule" />
          {layout.footerAbout && <p>{fill(layout.footerAbout, contact)}</p>}
          {markets.length > 0 && (
            <div className="lx-footer-markets">
              {markets.map((m, i) => (
                <span key={i}>
                  {i > 0 && (
                    <>
                      {" "}
                      <i>/</i>{" "}
                    </>
                  )}
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="lx-footer-contact">
          <h2>Contact</h2>
          <span className="lx-footer-rule" />
          <p>
            {contact.companyName}
            {addressLines.map((line) => (
              <span key={line}>
                <br />
                {line}
              </span>
            ))}
          </p>
          <p>
            {contact.email && (
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            )}
            {contact.phone && (
              <>
                <br />
                <a href={`tel:${contact.phone.replace(/\s+/g, "")}`}>
                  {contact.phone}
                </a>
              </>
            )}
            {contact.website && (
              <>
                <br />
                <a href={contact.website} rel="noopener" target="_blank">
                  {stripProtocol(contact.website)}
                </a>
              </>
            )}
          </p>
          {social.length > 0 && (
            <div className="lx-footer-social">
              {social.map((s) => (
                <a
                  key={s.key}
                  aria-label={s.label}
                  href={s.url}
                  rel="noopener noreferrer"
                  target="_blank"
                  title={s.label}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="lx-footer-company">
          <h2>{layout.footerCompanyTitle}</h2>
          <span className="lx-footer-rule" />
          {layout.footerCompany.map((l, i) => (
            <a key={i} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
        <div className="lx-footer-legal">
          <h2>{layout.footerLegalTitle}</h2>
          <span className="lx-footer-rule" />
          {layout.footerLegal.map((l, i) => (
            <a key={i} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
      </div>
      <div className="lx-footer-bottom">
        <span>{contact.copyright}</span>
        {layout.footerNote && <p>{fill(layout.footerNote, contact)}</p>}
      </div>
    </footer>
  );
}

export function CookieChoices() {
  const [visible, setVisible] = useState(false);
  const [settings, setSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lexarta_cookie_consent_v1");
      setVisible(!saved);
      if (saved) setAnalytics(Boolean(JSON.parse(saved).analytics));
    } catch {
      setVisible(true);
    }
  }, []);
  function save(value: boolean) {
    try {
      localStorage.setItem(
        "lexarta_cookie_consent_v1",
        JSON.stringify({
          necessary: true,
          analytics: value,
          updatedAt: new Date().toISOString(),
        }),
      );
    } catch {
      /* Storage may be disabled. */
    }
    setAnalytics(value);
    setVisible(false);
    setSettings(false);
  }
  return (
    <>
      {visible && !settings && (
        <section className="cookie-banner" aria-label="Cookie choices">
          <div>
            <h2>Your cookie choices</h2>
            <p>
              We use essential storage to remember your choice. Optional
              analytics is used only if you agree. Read our{" "}
              <a href="/cookies/">Cookie Policy</a>.
            </p>
          </div>
          <div className="cookie-actions">
            <Button size="sm" onClick={() => save(true)}>
              Accept analytics
            </Button>
            <Button size="sm" variant="outline" onClick={() => save(false)}>
              Reject analytics
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSettings(true)}>
              Settings
            </Button>
          </div>
        </section>
      )}
      {!visible && (
        <Button
          className="cookie-trigger"
          size="sm"
          variant="outline"
          onClick={() => setSettings(true)}
        >
          <Globe2 size={13} />
          Cookie settings
        </Button>
      )}
      {settings && (
        <div className="modal-backdrop" onClick={() => setSettings(false)}>
          <section
            className="cookie-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Cookie settings"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Cookie settings</h2>
            <p>
              Essential storage is required to save your choice. Analytics is
              optional and can be changed at any time.
            </p>
            <label>
              <input type="checkbox" checked disabled />
              <span>
                <strong>Essential</strong>Stores your cookie preference and
                supports the website’s basic operation.
              </span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
              />
              <span>
                <strong>Analytics</strong>Helps us understand aggregate website
                use. It remains off unless you choose it.
              </span>
            </label>
            <div className="cookie-actions">
              <Button onClick={() => save(analytics)}>Save choices</Button>
              <Button variant="outline" onClick={() => setSettings(false)}>
                Cancel
              </Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
