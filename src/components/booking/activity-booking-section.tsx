"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

import type { ActiveActivity } from "@/server/data/activities";

import { BookingWidget } from "./booking-widget";
import { FloorPlanPicker, type FloorPlanMarker } from "./floor-plan-picker";

export function ActivityBookingSection({
  activity,
  allActivities,
}: {
  activity: ActiveActivity;
  allActivities: ActiveActivity[];
}) {
  const hasFloorPlan = activity.floorPlanEnabled && activity.resources.some((r) => r.mapX != null);
  const [selectedResourceId, setSelectedResourceId] = useState<string | undefined>(undefined);
  const [showFloorPlan, setShowFloorPlan] = useState(hasFloorPlan);

  const selectedResource = activity.resources.find((r) => r.id === selectedResourceId);

  return (
    <div className="space-y-8">
      {hasFloorPlan && showFloorPlan && (
        <div>
          <div className="mb-4 flex items-center justify-center gap-2 text-center">
            <MapPin className="size-5 text-gold" />
            <h2 className="font-heading text-2xl font-bold">Choose your table</h2>
          </div>
          <p className="mb-5 text-center text-sm text-muted-foreground">
            Click a table on the floor plan, then pick a date and time.
          </p>
          <FloorPlanPicker
            resources={activity.resources}
            markers={activity.floorPlanMarkers as unknown as FloorPlanMarker[] | null}
            selectedResourceId={selectedResourceId}
            onSelect={(id) => {
              setSelectedResourceId(id);
              setShowFloorPlan(false);
            }}
            className="mx-auto max-w-3xl"
          />
        </div>
      )}

      {hasFloorPlan && !showFloorPlan && (
        <div className="mx-auto flex max-w-3xl items-center justify-between rounded-xl border border-border bg-card px-5 py-3">
          <p className="text-sm">
            Selected table: <span className="font-semibold text-gold">{selectedResource?.name}</span>
          </p>
          <button
            type="button"
            onClick={() => setShowFloorPlan(true)}
            className="text-sm font-medium text-gold hover:underline"
          >
            View floor plan
          </button>
        </div>
      )}

      {(!hasFloorPlan || selectedResourceId) && (
        <BookingWidget
          activities={allActivities}
          defaultActivityId={activity.id}
          initialResourceId={selectedResourceId}
          onChangeTable={hasFloorPlan ? () => setShowFloorPlan(true) : undefined}
        />
      )}
    </div>
  );
}
