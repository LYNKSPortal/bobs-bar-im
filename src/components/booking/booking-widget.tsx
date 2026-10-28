"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/pricing";
import { fetchAvailability, type AvailabilityActionResult } from "@/server/actions/availability";
import type { ActiveActivity } from "@/server/data/activities";

import { BookingDetailsDialog } from "./booking-details-dialog";

function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function BookingWidget({
  activities,
  defaultActivityId,
  variant = "light",
  initialResourceId,
  onChangeTable,
}: {
  activities: ActiveActivity[];
  defaultActivityId?: string;
  variant?: "light" | "dark";
  /** Lock the widget to one specific resource, e.g. a table chosen on a floor plan. */
  initialResourceId?: string;
  onChangeTable?: () => void;
}) {
  const [activityId, setActivityId] = useState(defaultActivityId ?? activities[0]?.id ?? "");
  const activity = useMemo(() => activities.find((a) => a.id === activityId), [activities, activityId]);
  const lockedResource = initialResourceId ? activity?.resources.find((r) => r.id === initialResourceId) : undefined;

  const [date, setDate] = useState<Date>(() => new Date());
  const [duration, setDuration] = useState<number>(activity?.defaultDurationMinutes ?? 60);
  const [partySize, setPartySize] = useState<number | undefined>(activity?.minPartySize ?? undefined);

  const [availability, setAvailability] = useState<AvailabilityActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleActivityChange(nextId: string) {
    setActivityId(nextId);
    const next = activities.find((a) => a.id === nextId);
    if (next) {
      setDuration(next.defaultDurationMinutes);
      setPartySize(next.minPartySize ?? undefined);
    }
  }

  useEffect(() => {
    if (!activityId) return;
    startTransition(async () => {
      const result = await fetchAvailability({
        activityId,
        date: toDateKey(date),
        durationMinutes: duration,
        resourceId: initialResourceId,
      });
      setAvailability(result);
    });
  }, [activityId, date, duration, initialResourceId]);

  const isDark = variant === "dark";

  const selectedSlot = availability?.slots?.find((s) => s.time === selectedTime);

  return (
    <div
      className={cn(
        "w-full rounded-2xl border p-5 shadow-xl sm:p-7",
        isDark ? "border-white/10 bg-ink/80 backdrop-blur text-ink-foreground" : "border-border bg-card"
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5 lg:col-span-1">
          <label className={cn("text-xs font-medium uppercase tracking-wide", isDark ? "text-ink-foreground/60" : "text-muted-foreground")}>
            {lockedResource ? "Table" : "Activity"}
          </label>
          {lockedResource ? (
            <div
              className={cn(
                "flex h-9 items-center justify-between rounded-md border px-3 text-sm font-medium",
                isDark ? "border-white/15 bg-white/5 text-ink-foreground" : "border-border bg-background"
              )}
            >
              <span>{lockedResource.name}</span>
              {onChangeTable && (
                <button type="button" onClick={onChangeTable} className="text-xs font-medium text-gold hover:underline">
                  Change
                </button>
              )}
            </div>
          ) : (
            <Select value={activityId} onValueChange={(v) => v && handleActivityChange(v)}>
              <SelectTrigger className={cn("w-full", isDark && "border-white/15 bg-white/5 text-ink-foreground")}>
                <SelectValue placeholder="Choose an activity" />
              </SelectTrigger>
              <SelectContent>
                {activities.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={cn("text-xs font-medium uppercase tracking-wide", isDark ? "text-ink-foreground/60" : "text-muted-foreground")}>
            Date
          </label>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  className={cn("justify-start text-left font-normal", isDark && "border-white/15 bg-white/5 text-ink-foreground hover:bg-white/10")}
                />
              }
            >
              <CalendarIcon className="mr-2 size-4" />
              {format(date, "EEE d MMM yyyy")}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={cn("text-xs font-medium uppercase tracking-wide", isDark ? "text-ink-foreground/60" : "text-muted-foreground")}>
            Duration
          </label>
          <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
            <SelectTrigger className={cn("w-full", isDark && "border-white/15 bg-white/5 text-ink-foreground")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(activity?.durationsMinutes ?? [60]).map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d} minutes
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activity?.maxPartySize ? (
          <div className="flex flex-col gap-1.5">
            <label className={cn("text-xs font-medium uppercase tracking-wide", isDark ? "text-ink-foreground/60" : "text-muted-foreground")}>
              <Users className="mr-1 inline size-3" />
              Party size
            </label>
            <Select value={String(partySize ?? activity.minPartySize ?? 1)} onValueChange={(v) => setPartySize(Number(v))}>
              <SelectTrigger className={cn("w-full", isDark && "border-white/15 bg-white/5 text-ink-foreground")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from(
                  { length: (activity.maxPartySize ?? 1) - (activity.minPartySize ?? 1) + 1 },
                  (_, i) => (activity.minPartySize ?? 1) + i
                ).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} {n === 1 ? "person" : "people"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      <div className="mt-6">
        <p className={cn("mb-3 text-xs font-medium uppercase tracking-wide", isDark ? "text-ink-foreground/60" : "text-muted-foreground")}>
          Available times
        </p>

        {isPending ? (
          <div className={cn("flex items-center gap-2 py-8 text-sm", isDark ? "text-ink-foreground/60" : "text-muted-foreground")}>
            <Loader2 className="size-4 animate-spin" /> Checking availability...
          </div>
        ) : !availability?.ok ? (
          <p className="py-8 text-sm text-destructive">{availability?.error ?? "Unable to load availability."}</p>
        ) : availability.slots && availability.slots.filter((s) => s.available).length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {availability.slots
              .filter((s) => s.available)
              .map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => {
                    setSelectedTime(slot.time);
                    setDialogOpen(true);
                  }}
                  className={cn(
                    "flex flex-col items-center rounded-lg border px-2 py-2.5 text-sm font-medium transition-colors",
                    isDark
                      ? "border-white/15 bg-white/5 text-ink-foreground hover:border-gold hover:bg-gold/10 hover:text-gold"
                      : "border-border bg-background hover:border-gold hover:bg-gold/10"
                  )}
                >
                  <span>{formatTimeLabel(slot.time)}</span>
                  <span className={cn("text-[11px]", isDark ? "text-ink-foreground/50" : "text-muted-foreground")}>
                    {formatPrice(slot.price, availability.currency ?? "gbp")}
                  </span>
                </button>
              ))}
          </div>
        ) : (
          <p className={cn("py-8 text-sm", isDark ? "text-ink-foreground/60" : "text-muted-foreground")}>
            No availability on this date. Try another day.
          </p>
        )}
      </div>

      {activity && selectedSlot && (
        <BookingDetailsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          activity={activity}
          date={date}
          time={selectedSlot.time}
          durationMinutes={duration}
          price={selectedSlot.price}
          currency={availability?.currency ?? "gbp"}
          availableResourceIds={selectedSlot.availableResourceIds}
          partySize={partySize}
          forcedResourceId={initialResourceId}
        />
      )}
    </div>
  );
}

function formatTimeLabel(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}
