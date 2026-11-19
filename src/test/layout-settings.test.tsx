import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import {
  DEFAULT_CONTACT,
  DEFAULT_LAYOUT,
  mergeSettings,
} from "@/lib/site-settings";

describe("editable header & footer", () => {
  it("defaults reproduce the original header and footer", () => {
    const { container } = render(
      <>
        <SiteHeader path="/about/" />
        <SiteFooter contact={DEFAULT_CONTACT} />
      </>,
    );
    const nav = [
      ...container.querySelectorAll(
        ".primary-nav > a, .services-nav-label > a",
      ),
    ];
    expect(nav.map((a) => a.textContent)).toEqual([
      "Home",
      "Services",
      "Insights",
      "About",
      "Contact",
    ]);
    expect(container.querySelector(".primary-nav a.active")?.textContent).toBe(
      "About",
    );
    expect(container.querySelector(".header-cta")?.textContent).toContain(
      "Book a Consultation",
    );
    expect(container.querySelector(".lx-footer-markets")?.textContent).toBe(
      "LONDON / UNITED KINGDOM / INTERNATIONAL",
    );
    expect(container.querySelector(".lx-footer-bottom p")?.textContent).toBe(
      "LEX ARTA is a professional services brand owned by Artlex Global LTD. This website is operated by Artlex Global LTD, registered in England and Wales under company number 17479929. Website content is general information only and does not constitute professional advice.",
    );
  });

  it("renders the edited menu, button and footer links", () => {
    const layout = {
      ...DEFAULT_LAYOUT,
      brandName: "NEW BRAND",
      headerLinks: [
        { label: "Start", href: "/" },
        { label: "Our services", href: "/services/" },
        { label: "Blog", href: "/insights/" },
      ],
      cta: { label: "", href: "/" },
      footerLegal: [{ label: "Imprint", href: "/legal-notice/" }],
    };
    const { container } = render(
      <>
        <SiteHeader path="/services/aml-cft/" layout={layout} />
        <SiteFooter contact={DEFAULT_CONTACT} layout={layout} />
      </>,
    );
    expect(container.querySelector(".brand-name")?.textContent).toContain(
      "NEW BRAND",
    );
    expect(container.querySelector(".services-nav-label a")?.textContent).toBe(
      "Our services",
    );
    expect(container.querySelector(".services-nav-label a")?.className).toBe(
      "active",
    );
    expect(container.querySelector(".header-cta")).toBeNull();
    expect(
      [...container.querySelectorAll(".lx-footer-legal a")].map(
        (a) => a.textContent,
      ),
    ).toEqual(["Imprint"]);
  });

  it("fills missing or malformed saved layout fields with defaults", () => {
    const s = mergeSettings({
      layout: { brandName: "X", headerLinks: "bad" } as never,
    });
    expect(s.layout.brandName).toBe("X");
    expect(s.layout.headerLinks).toEqual(DEFAULT_LAYOUT.headerLinks);
    expect(mergeSettings({}).layout).toEqual(DEFAULT_LAYOUT);
  });
});
