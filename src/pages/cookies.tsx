import type { PageMeta } from "./types";

export const meta: PageMeta = {
  path: "/cookies/",
  title: "Cookie Policy | LEX ARTA",
  heading: "Cookie Policy",
  description:
    "How lexarta.co uses cookies, browser storage and comparable technologies.",
  heroImage: "/images/cookies-hero-2026.webp",
};

export default function Page() {
  return (
    <>
      <main>
        <section className="hero">
          <div className="container">
            <div className="hero-grid">
              <div className="hero-copy">
                <div className="eyebrow">Privacy and technology</div>
                <h1>Cookie Policy</h1>
                <p className="hero-lead">
                  Storage and access technologies used on the Website
                </p>
                <div className="hero-meta">
                  <span>Effective date: 10 November 2026</span>
                  <span>Website operator: Artlex Global LTD</span>
                </div>
              </div>
              <div className="hero-visual">
                <img
                  alt="LEX ARTA professional services"
                  loading="lazy"
                  src="/images/cookies-hero-2026.webp"
                />
              </div>
            </div>
          </div>
        </section>
        <section className="legal-main">
          <div className="container legal-layout">
            <aside className="toc">
              <h2>On this page</h2>
              <a href="/cookies/#s-scope-and-controller">
                1. Scope and controller
              </a>
              <a href="/cookies/#s-current-configuration">
                2. Current configuration
              </a>
              <a href="/cookies/#s-optional-technologies">
                3. Optional technologies
              </a>
              <a href="/cookies/#s-managing-choices">4. Managing choices</a>
              <a href="/cookies/#s-changes">5. Changes</a>
            </aside>
            <article>
              <section id="s-scope-and-controller">
                <div className="caps">1</div>
                <h2>Scope and controller</h2>
                <p>
                  This Cookie Policy explains how{" "}
                  <a href="/">https://www.lexarta.co/</a> (the Website) uses
                  cookies, browser storage, tags and comparable technologies.
                  The Website is operated by Artlex Global LTD. Its company
                  details appear in the{" "}
                  <a href="/legal-notice/">Legal Notice</a>. Questions may be
                  sent to{" "}
                  <a href="mailto:privacy@lexarta.co">privacy@lexarta.co</a>.
                </p>
                <p>
                  This Policy is intended to reflect the Privacy and Electronic
                  Communications Regulations 2003, the UK GDPR and, for
                  processing to which EU GDPR applies, applicable EU and Member
                  State rules on cookies and similar technologies. It should be
                  read with the <a href="/privacy/">Privacy Notice</a>.
                </p>
              </section>
              <section id="s-current-configuration">
                <div className="caps">2</div>
                <h2>Current configuration</h2>
                <p>
                  As at the effective date, Artlex Global LTD's intended Website
                  configuration does not activate advertising, remarketing,
                  social-media tracking, audience-building or optional analytics
                  technologies before the visitor makes a positive choice where
                  consent is required. The Website must not deploy a technology
                  that is not accurately described in this Policy and the
                  applicable consent interface.
                </p>
                <p>
                  Strictly necessary storage or access may operate without
                  consent only where the applicable legal exception applies, for
                  example where it is necessary for an expressly requested
                  technical service or to preserve a recorded cookie choice.
                </p>
                <table className="legal-table">
                  <thead>
                    <tr>
                      <th>Technology</th>
                      <th>Provider</th>
                      <th>Purpose</th>
                      <th>Category</th>
                      <th>Retention</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>lexarta_cookie_consent_v1</td>
                      <td>Artlex Global LTD</td>
                      <td>
                        Records the visitor's cookie choice, if the preference
                        interface is displayed
                      </td>
                      <td>Strictly necessary preference storage</td>
                      <td>Until changed or browser storage is cleared</td>
                    </tr>
                    <tr>
                      <td>Optional analytics</td>
                      <td>None active at the effective date</td>
                      <td>Not applicable</td>
                      <td>Not applicable</td>
                      <td>Not applicable</td>
                    </tr>
                    <tr>
                      <td>Advertising or social-media tracking</td>
                      <td>None active at the effective date</td>
                      <td>Not applicable</td>
                      <td>Not applicable</td>
                      <td>Not applicable</td>
                    </tr>
                  </tbody>
                </table>
              </section>
              <section id="s-optional-technologies">
                <div className="caps">3</div>
                <h2>Optional technologies</h2>
                <p>
                  Before optional analytics, advertising, embedded third-party
                  content, tracking pixels, tags or other non-exempt storage and
                  access technologies are enabled, Artlex Global LTD will assess
                  the applicable law, update this Policy and the technology
                  table, and provide an appropriate consent or objection
                  mechanism. A refusal must not prevent access to ordinary
                  Website content except where the relevant technology is
                  genuinely necessary for a requested feature.
                </p>
              </section>
              <section id="s-managing-choices">
                <div className="caps">4</div>
                <h2>Managing choices</h2>
                <p>
                  Where a consent interface is shown, visitors may revisit their
                  choice through the Cookie Settings link or button on the
                  Website. Browser settings can also be used to delete or block
                  cookies and browser storage. Blocking strictly necessary
                  storage may affect the operation of preference controls or
                  requested Website functions.
                </p>
              </section>
              <section id="s-changes">
                <div className="caps">5</div>
                <h2>Changes</h2>
                <p>
                  We review this Policy when Website hosting, analytics,
                  embedded content, forms, CRM, marketing or consent technology
                  materially changes. Questions may be sent to{" "}
                  <a href="mailto:privacy@lexarta.co">privacy@lexarta.co</a>.
                </p>
              </section>
            </article>
          </div>
        </section>
        <section className="final-cta">
          <div className="final-cta-strip">
            <div className="container final-cta-inner">
              <div>
                <h2>Questions about this page?</h2>
                <p>
                  Contact Artlex Global LTD at{" "}
                  <a href="mailto:info@lexarta.co">info@lexarta.co</a>.
                </p>
              </div>
              <div className="final-cta-actions">
                <a className="btn btn-primary" href="/contact/">
                  Contact us
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
