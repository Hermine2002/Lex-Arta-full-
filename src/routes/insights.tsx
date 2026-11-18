import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { InsightsListing } from "@/components/insights-listing";
import { insightArticles, type ArticleView } from "@/data/insights";
import { pageHead } from "@/lib/site-content";

export const Route = createFileRoute("/insights")({
  head: ({ matches }) => pageHead("/insights/", matches),
  component: InsightsIndex,
});

function InsightsIndex() {
  const admin = getRouteApi("__root__").useLoaderData()?.articles ?? [];
  const all: ArticleView[] = [...admin, ...insightArticles].sort((a, b) =>
    b.dateTime.localeCompare(a.dateTime),
  );
  return <InsightsListing articles={all} />;
}
