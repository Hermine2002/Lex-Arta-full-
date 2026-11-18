import { createFileRoute } from "@tanstack/react-router";
import { UsersAdmin } from "@/components/admin/users-admin";

export const Route = createFileRoute("/admin/users")({
  component: UsersAdmin,
});
