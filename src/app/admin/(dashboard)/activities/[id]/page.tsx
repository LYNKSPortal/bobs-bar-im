import { notFound } from "next/navigation";

import { ActivityForm } from "@/components/admin/activity-form";
import { ResourceManager } from "@/components/admin/resource-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: { resources: { orderBy: { sortOrder: "asc" } } },
  });
  if (!activity) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      <h1 className="font-heading text-2xl font-bold sm:text-3xl">{activity.name}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <ResourceManager activityId={activity.id} resources={activity.resources} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity details</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityForm
            initial={{
              id: activity.id,
              name: activity.name,
              slug: activity.slug,
              description: activity.description,
              shortDescription: activity.shortDescription ?? "",
              imageUrl: activity.imageUrl ?? "",
              active: activity.active,
              allowResourceSelection: activity.allowResourceSelection,
              durationsMinutes: activity.durationsMinutes,
              defaultDurationMinutes: activity.defaultDurationMinutes,
              minPartySize: activity.minPartySize ?? undefined,
              maxPartySize: activity.maxPartySize ?? undefined,
              basePriceHourly: activity.basePriceHourly,
              paymentMode: activity.paymentMode,
              depositPercent: activity.depositPercent ?? undefined,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
