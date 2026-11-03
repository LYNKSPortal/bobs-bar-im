import { redirect } from "next/navigation";

// The "Today" dashboard (with its heavy schedule queries) has been removed to
// cut down on database load. Bookings is now the main landing page — this is
// a pure redirect with no database queries of its own.
export default function AdminIndexPage() {
  redirect("/admin/bookings");
}
