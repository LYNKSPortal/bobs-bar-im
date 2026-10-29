"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CheckCircle2, Loader2, Trash2, UserCheck, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatPrice } from "@/lib/pricing";
import { cancelAdminBooking, markBookingArrived, updateBookingStatusAction } from "@/server/actions/admin-bookings";
import { removeAdminBlock } from "@/server/actions/admin-blocks";
import type { ScheduleItem } from "@/server/data/schedule";

import { BlockTimeDialog } from "./block-time-dialog";
import { DayTimeline, TimelineLegend, type TimelineResource } from "./day-timeline";
import { NewBookingDialog } from "./new-booking-dialog";

interface ActivityWithResources {
  id: string;
  name: string;
  durationsMinutes: number[];
  resources: { id: string; name: string; status: string }[];
}

interface FullItem extends ScheduleItem {
  priceTotal?: number;
  currency?: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
}

export function ScheduleView({
  activities,
  items,
  date,
}: {
  activities: ActivityWithResources[];
  items: FullItem[];
  date: Date;
}) {
  const resources: TimelineResource[] = activities.flatMap((a) =>
    a.resources
      .filter((r) => r.status !== "RETIRED")
      .map((r) => ({ id: r.id, name: r.name, activityName: a.name, activityId: a.id, status: r.status }))
  );

  const [bookingDialog, setBookingDialog] = useState<{ open: boolean; resourceId?: string; activityId?: string; time?: string }>({
    open: false,
  });
  const [blockDialog, setBlockDialog] = useState<{ open: boolean; resourceId?: string; activityId?: string; time?: string }>({
    open: false,
  });
  const [selectedItem, setSelectedItem] = useState<FullItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  function handleEmptyClick(resourceId: string, time: string) {
    const activityId = resources.find((r) => r.id === resourceId)?.activityId;
    setBookingDialog({ open: true, resourceId, activityId, time });
  }

  async function handleAction(action: () => Promise<{ ok: boolean; error?: string }>) {
    setActionLoading(true);
    const result = await action();
    setActionLoading(false);
    if (!result.ok) {
      toast.error(result.error ?? "Something went wrong.");
      return;
    }
    toast.success("Updated.");
    setSelectedItem(null);
  }

  return (
    <div className="space-y-4">
      <TimelineLegend />

      <DayTimeline
        resources={resources}
        items={items}
        onEmptyClick={handleEmptyClick}
        onItemClick={(item) => setSelectedItem(item as FullItem)}
      />

      <NewBookingDialog
        activities={activities}
        defaultDate={date}
        defaultResourceId={bookingDialog.resourceId}
        defaultActivityId={bookingDialog.activityId}
        defaultStartTime={bookingDialog.time}
        trigger={null}
        open={bookingDialog.open}
        onOpenChange={(open) => setBookingDialog((s) => ({ ...s, open }))}
      />
      <BlockTimeDialog
        activities={activities}
        defaultDate={date}
        defaultResourceId={blockDialog.resourceId}
        defaultActivityId={blockDialog.activityId}
        defaultStartTime={blockDialog.time}
        trigger={null}
        open={blockDialog.open}
        onOpenChange={(open) => setBlockDialog((s) => ({ ...s, open }))}
      />

      <Sheet open={Boolean(selectedItem)} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent side="right">
          {selectedItem && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedItem.kind === "booking" ? selectedItem.label : `Blocked: ${selectedItem.label}`}</SheetTitle>
                <SheetDescription>
                  {format(selectedItem.startTime, "EEE d MMM, h:mm a")} &ndash; {format(selectedItem.endTime, "h:mm a")}
                </SheetDescription>
              </SheetHeader>

              <div className="px-4">
                {selectedItem.kind === "booking" ? (
                  <div className="space-y-3 text-sm">
                    {selectedItem.subLabel && (
                      <p>
                        <span className="text-muted-foreground">Reference:</span> {selectedItem.subLabel}
                      </p>
                    )}
                    {selectedItem.customerEmail && (
                      <p>
                        <span className="text-muted-foreground">Email:</span> {selectedItem.customerEmail}
                      </p>
                    )}
                    {selectedItem.customerPhone && (
                      <p>
                        <span className="text-muted-foreground">Phone:</span> {selectedItem.customerPhone}
                      </p>
                    )}
                    {selectedItem.priceTotal !== undefined && (
                      <p>
                        <span className="text-muted-foreground">Price:</span>{" "}
                        {formatPrice(selectedItem.priceTotal, selectedItem.currency ?? "gbp")}
                      </p>
                    )}
                    <p>
                      <span className="text-muted-foreground">Status:</span>{" "}
                      <Badge variant="secondary">{selectedItem.status}</Badge>
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{selectedItem.subLabel || "No additional notes."}</p>
                )}
              </div>

              <SheetFooter className="gap-2">
                {selectedItem.kind === "booking" ? (
                  <>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={actionLoading}
                        onClick={() => handleAction(() => markBookingArrived(selectedItem.id))}
                      >
                        <UserCheck className="mr-1.5 size-4" /> Arrived
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={actionLoading}
                        onClick={() => handleAction(() => updateBookingStatusAction(selectedItem.id, "COMPLETED"))}
                      >
                        <CheckCircle2 className="mr-1.5 size-4" /> Completed
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={actionLoading}
                        onClick={() => handleAction(() => updateBookingStatusAction(selectedItem.id, "NO_SHOW"))}
                      >
                        <XCircle className="mr-1.5 size-4" /> No-show
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        disabled={actionLoading}
                        onClick={() => handleAction(() => cancelAdminBooking(selectedItem.id))}
                      >
                        Cancel booking
                      </Button>
                    </div>
                    <Button size="sm" variant="ghost" render={<Link href={`/admin/bookings/${selectedItem.id}`} />} nativeButton={false}>
                      View full details
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="destructive"
                    disabled={actionLoading}
                    onClick={() =>
                      handleAction(async () => {
                        setActionLoading(true);
                        const result = await removeAdminBlock(selectedItem.id.split("-")[0]);
                        return result;
                      })
                    }
                  >
                    {actionLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
                    Remove block
                  </Button>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
