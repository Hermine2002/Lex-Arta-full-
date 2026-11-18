import { createFileRoute } from "@tanstack/react-router";
import { MediaAdmin } from "@/components/admin/media-admin";

export const Route = createFileRoute("/admin/media")({
  component: MediaAdmin,
});
