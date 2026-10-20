import Link from "next/link";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityActiveToggle } from "@/components/admin/activity-active-toggle";
import { prisma } from "@/lib/prisma";

export default async function AdminActivitiesPage() {
  const activities = await prisma.activity.findMany({
    orderBy: { sortOrder: "asc" },
    include: { resources: true, _count: { select: { bookings: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Activities</h1>
        <Button render={<Link href="/admin/activities/new" />} className="bg-gold text-gold-foreground hover:bg-gold/90">
          <Plus className="mr-2 size-4" /> Add Activity
        </Button>
      </div>

      <div className="grid gap-4">
        {activities.map((activity) => (
          <Card key={activity.id}>
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/activities/${activity.id}`} className="font-heading text-lg font-semibold hover:text-gold">
                    {activity.name}
                  </Link>
                  {!activity.active && <Badge variant="secondary">Inactive</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activity.resources.length} resources &middot; £{(activity.basePriceHourly / 100).toFixed(2)}/hr &middot;{" "}
                  {activity._count.bookings} bookings
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ActivityActiveToggle activityId={activity.id} active={activity.active} />
                <Button variant="outline" size="sm" render={<Link href={`/admin/activities/${activity.id}`} />}>
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
