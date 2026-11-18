import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { InsightArticlePage } from "@/components/insight-article-page";
import type { AdminArticle } from "@/lib/articles";
import { resolveImageUrl } from "@/lib/assets";

// Dynamic page for admin-authored articles. Bundled articles keep their own
// static routes, which TanStack matches ahead of this `$slug` fallback.
export const Route = createFileRoute("/insights_/$slug")({
  head: ({ params, matches }) => {
    const article = findArticle(matches, params.slug);
    if (!article) return {};
    const heroImage = article.image ? resolveImageUrl(article.image) : null;
    return {
      meta: [
        { title: `${article.title} | LEX ARTA` },
        { name: "description", content: article.brief },
        { property: "og:title", content: article.title },
        { property: "og:description", content: article.brief },
        { property: "og:type", content: "article" },
        ...(heroImage
          ? [
              { property: "og:image", content: heroImage },
              { name: "twitter:image", content: heroImage },
            ]
          : []),
      ],
    };
  },
  component: ArticleRoute,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findArticle(matches: any[], slug: string): AdminArticle | undefined {
  const root = matches?.find((m) => m.routeId === "__root__");
  const articles: AdminArticle[] = root?.loaderData?.articles ?? [];
  return articles.find((a) => a.slug === slug);
}

function ArticleRoute() {
  const { slug } = Route.useParams();
  const articles = getRouteApi("__root__").useLoaderData()?.articles ?? [];
  const article = articles.find((a) => a.slug === slug);

  if (!article) {
    return (
      <main className="lx-basic" id="main-content">
        <p className="kicker">404</p>
        <h1>Article not found</h1>
        <p>This article does not exist or has been unpublished.</p>
        <p>
          <a href="/insights/">Back to all insights</a>
        </p>
      </main>
    );
  }
  return <InsightArticlePage article={article} />;
}
