import { InsightsListing } from "@/components/insights-listing";
import { insightArticles } from "@/data/insights";
import type { PageMeta } from "./types";

export const meta: PageMeta = {
  path: "/insights/",
  title: "Insights | MiCA, AML/CFT & Regulatory Compliance | LEX ARTA",
  heading: "Regulatory insight for decisions that matter.",
  description:
    "Practical analysis of licensing, AML/CFT, financial services and data protection for regulated businesses.",
  heroImage: null,
};

export default function Page() {
  return <InsightsListing articles={[...insightArticles]} />;
}
