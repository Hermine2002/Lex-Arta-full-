import { createFileRoute } from "@tanstack/react-router";
import { InsightsAdmin } from "@/components/admin/insights-admin";

export const Route = createFileRoute("/admin/insights")({
  component: InsightsAdmin,
});
