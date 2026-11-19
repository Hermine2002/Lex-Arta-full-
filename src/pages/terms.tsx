import type { PageMeta } from "./types";

export const meta: PageMeta = {
  path: "/terms/",
  title: "Terms of Use | LEX ARTA",
  heading: "Terms of Use",
  description: "Rules for access to and use of lexarta.co.",
  heroImage: "/images/terms-hero-2026.webp",
};

export default function Page() {
  return (
    <>
      <main>
        <section className="hero">
          <div className="container">
            <div className="hero-grid">
              <div className="hero-copy">
                <div className="eyebrow">Website terms</div>
                <h1>Terms of Use</h1>
                <p className="hero-lead">Rules for access to the Website</p>
                <div className="hero-meta">
                  <span>Effective date: 10 November 2026</span>
                  <span>Website operator: Artlex Global LTD</span>
                </div>
              </div>
              <div className="hero-visual">
                <img
                  alt="LEX ARTA professional services"
                  loading="lazy"
                  src="/images/terms-hero-2026.webp"
                />
              </div>
            </div>
          </div>
        </section>
        <section className="legal-main">
          <div className="container legal-layout">
            <aside className="toc">
              <h2>On this page</h2>
              <a href="/terms/#s-operator-and-purpose">
                1. Operator and purpose
              </a>
              <a href="/terms/#s-no-engagement-and-routing-of-enquiries">
                2. No engagement and routing of enquiries
              </a>
              <a href="/terms/#s-permitted-website-use">
                3. Permitted Website use
              </a>
              <a href="/terms/#s-intellectual-property-and-links">
                4. Intellectual property and links
              </a>
              <a href="/terms/#s-availability-and-liability">
                5. Availability and liability
              </a>
              <a href="/terms/#s-privacy-cookies-and-law">
                6. Privacy, cookies and law
              </a>
            </aside>
            <article>
              <section id="s-operator-and-purpose">
                <div className="caps">1</div>
                <h2>Operator and purpose</h2>
                <p>
                  These Terms of Use govern access to and use of{" "}
                  <a href="/">https://www.lexarta.co/</a> (the Website). The
                  Website is operated by Artlex Global LTD. Its company details
                  appear in the <a href="/legal-notice/">Legal Notice</a>.
                </p>
                <p>
                  The Website is intended for businesses, organisations and
                  professionals acting in the course of business. It is not an
                  offer to provide professional services, and it does not govern
                  any engagement for services.
                </p>
              </section>
              <section id="s-no-engagement-and-routing-of-enquiries">
                <div className="caps">2</div>
                <h2>No engagement and routing of enquiries</h2>
                <p>
                  Browsing the Website, downloading content, sending a message,
                  attending an introductory call, receiving a proposal or
                  discussing a possible scope does not create an adviser-client
                  or other professional relationship with Artlex Global LTD,
                  Artlex Consult s.r.o. or any other provider.
                </p>
                <p>
                  A professional engagement exists only when one legal entity is
                  expressly named as the Contracting Entity in an Engagement
                  Letter accepted by that entity and the Client. The shared LEX
                  ARTA® brand and any referral do not determine the Contracting
                  Entity or create joint responsibility.
                </p>
                <p>
                  Artlex Global LTD may, after assessment and in accordance with
                  the <a href="/privacy/">Privacy Notice</a>, make an
                  introduction to Artlex Consult s.r.o. or an independent
                  provider. Each recipient independently decides whether to
                  accept work and, if it does, contracts directly for its own
                  scope.
                </p>
              </section>
              <section id="s-permitted-website-use">
                <div className="caps">3</div>
                <h2>Permitted Website use</h2>
                <p>
                  You may use the Website for lawful internal business
                  information. You must not misuse the Website; attempt
                  unauthorised access; introduce malicious code; interfere with
                  its operation; submit false, misleading or unlawful
                  information; impersonate another person; use the Website for
                  unlawful or unsolicited marketing; or use automated means to
                  extract Website content without prior written permission.
                </p>
                <p>
                  Do not send identity documents, AML/KYC files,
                  special-category data, criminal-offence data, confidential
                  client datasets or commercially sensitive information through
                  the public contact form before an engagement and secure
                  submission method have been agreed. Pre-engagement information
                  is not necessarily privileged and does not prevent a
                  Contracting Entity from acting for another person, subject to
                  its conflict process.
                </p>
              </section>
              <section id="s-intellectual-property-and-links">
                <div className="caps">4</div>
                <h2>Intellectual property and links</h2>
                <p>
                  Website content is owned by or licensed to Artlex Global LTD.
                  You may view and print it for internal business information
                  only. You may not reproduce, republish, commercially exploit,
                  systematically extract, use for machine learning or
                  artificial-intelligence training, or use the LEX ARTA® brand
                  or Website content in a way that suggests affiliation,
                  endorsement or authority without prior written consent.
                </p>
                <p>
                  Third-party links are supplied for convenience only. Artlex
                  Global LTD does not control, endorse or accept responsibility
                  for third-party content, products or services.
                </p>
              </section>
              <section id="s-availability-and-liability">
                <div className="caps">5</div>
                <h2>Availability and liability</h2>
                <p>
                  Artlex Global LTD may change, suspend or withdraw Website
                  content at any time. To the fullest extent permitted by law,
                  it is not liable for loss arising solely from reliance on
                  general Website content, temporary unavailability of the
                  Website or third-party websites. Nothing in these Terms
                  excludes liability that cannot lawfully be excluded or
                  limited.
                </p>
              </section>
              <section id="s-privacy-cookies-and-law">
                <div className="caps">6</div>
                <h2>Privacy, cookies and law</h2>
                <p>
                  Personal-data processing is described in the{" "}
                  <a href="/privacy/">Privacy Notice</a>. Cookies and comparable
                  technologies are described in the{" "}
                  <a href="/cookies/">Cookie Policy</a>.
                </p>
                <p>
                  These Terms and any non-contractual obligations arising from
                  them are governed by the law of England and Wales. The courts
                  of England and Wales have exclusive jurisdiction, subject to
                  mandatory law that applies otherwise.
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
