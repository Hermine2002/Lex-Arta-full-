import { useMemo, useState } from "react";
import { insightCategories, type ArticleView } from "@/data/insights";
import { resolveImageUrl } from "@/lib/assets";

function InsightCard({ article }: { article: ArticleView }) {
  return (
    <a
      className="insight-card"
      data-insight-card
      data-insight-category={article.category}
      href={article.href}
    >
      <span className="insight-card-image">
        <img
          src={resolveImageUrl(article.image)}
          alt={article.imageAlt}
          loading="lazy"
        />
      </span>
      <span className="insight-card-content">
        <span className="insight-meta">
          <span>{article.category}</span>
          <time dateTime={article.dateTime}>{article.date}</time>
        </span>
        {article.author && (
          <span className="insight-card-author">{article.author}</span>
        )}
        <span className="insight-card-title">{article.title}</span>
        {article.summary && (
          <span className="insight-card-summary">{article.summary}</span>
        )}
        <span className="insight-read">
          Read Article <span aria-hidden="true">↗</span>
        </span>
      </span>
    </a>
  );
}

/**
 * The Insights index. Takes the list of articles to show so the same markup can
 * render the bundled set (static) or the bundled set plus admin-authored articles
 * (live, in the route). Filtering is handled in React instead of the global
 * gallery script used by bundled SitePage content.
 */
export function InsightsListing({ articles }: { articles: ArticleView[] }) {
  const [active, setActive] = useState<string>("all");
  const shown = useMemo(
    () =>
      active === "all"
        ? articles
        : articles.filter((a) => a.category === active),
    [articles, active],
  );

  return (
    <main className="insights-page">
      <section className="insights-hero">
        <div className="container insights-hero-grid">
          <div className="insights-heading">
            <p className="eyebrow">LEX ARTA / Insights</p>
            <h1>Regulatory insight for decisions that matter.</h1>
            <p>
              Practical analysis of licensing, AML/CFT, financial services and
              data protection for regulated businesses. Each article separates
              the rule from the questions that need a business-specific
              assessment.
            </p>
            <a className="btn btn-primary" href="/book-a-consultation/">
              Book a consultation
            </a>
          </div>
          <div aria-hidden="true" className="insights-hero-art">
            <span>INSIGHTS</span>
            <i />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="latest-insights-title"
        className="section insights-listing"
      >
        <div className="container">
          <div className="insights-listing-heading">
            <div>
              <p className="section-kicker">Latest analysis</p>
              <h2 id="latest-insights-title">Explore our thinking.</h2>
            </div>
            <p>
              Browse concise briefings with source links and a clear date of
              review.
            </p>
          </div>

          <div aria-label="Filter articles" className="insights-filters">
            <button
              aria-pressed={active === "all"}
              className={`insights-filter${active === "all" ? " active" : ""}`}
              onClick={() => setActive("all")}
              type="button"
            >
              All
            </button>
            {insightCategories.map((category) => (
              <button
                aria-pressed={active === category}
                className={`insights-filter${active === category ? " active" : ""}`}
                key={category}
                onClick={() => setActive(category)}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>

          <div className="insights-grid">
            {shown.map((article) => (
              <InsightCard article={article} key={article.href} />
            ))}
          </div>
          {shown.length === 0 && (
            <p className="insights-empty">No articles in this category yet.</p>
          )}
          <nav aria-label="Insights pages" className="insights-pagination" />
        </div>
      </section>

      <section className="section insights-cta">
        <div className="container insights-cta-inner">
          <div>
            <p className="section-kicker">Discuss your project</p>
            <h2>Turn regulatory questions into a clear work plan.</h2>
          </div>
          <a className="btn btn-primary" href="/book-a-consultation/">
            Book a consultation
          </a>
        </div>
      </section>
    </main>
  );
}
