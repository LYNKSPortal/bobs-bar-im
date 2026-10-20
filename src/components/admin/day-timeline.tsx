"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";
import type { ScheduleItem } from "@/server/data/schedule";

export interface TimelineResource {
  id: string;
  name: string;
  activityName: string;
  activityId: string;
  status: string;
}

const SLOT_MINUTES = 30;

function statusClasses(item: ScheduleItem) {
  if (item.kind === "block") return "bg-muted-foreground/25 text-foreground border border-muted-foreground/40";
  switch (item.status) {
    case "CONFIRMED":
      return "bg-gold/25 text-foreground border border-gold/60";
    case "PENDING":
      return "bg-blue-200 text-blue-950 border border-blue-400 dark:bg-blue-900/40 dark:text-blue-100";
    case "COMPLETED":
      return "bg-green-200 text-green-950 border border-green-400 dark:bg-green-900/40 dark:text-green-100";
    case "NO_SHOW":
      return "bg-destructive/20 text-destructive border border-destructive/40";
    case "CANCELLED":
      return "bg-transparent text-muted-foreground/50 border border-dashed border-muted-foreground/30 line-through";
    default:
      return "bg-secondary";
  }
}

export function TimelineLegend() {
  const items = [
    { label: "Online / confirmed", cls: "bg-gold/25 border-gold/60" },
    { label: "Pending", cls: "bg-blue-200 border-blue-400" },
    { label: "Completed", cls: "bg-green-200 border-green-400" },
    { label: "No-show", cls: "bg-destructive/20 border-destructive/40" },
    { label: "Blocked / unavailable", cls: "bg-muted-foreground/25 border-muted-foreground/40" },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className={cn("size-3 rounded border", i.cls)} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

export function DayTimeline({
  resources,
  items,
  startHour = 8,
  endHour = 24,
  onEmptyClick,
  onItemClick,
}: {
  resources: TimelineResource[];
  items: ScheduleItem[];
  startHour?: number;
  endHour?: number;
  onEmptyClick?: (resourceId: string, time: string) => void;
  onItemClick?: (item: ScheduleItem) => void;
}) {
  const totalMinutes = (endHour - startHour) * 60;
  const totalSlots = totalMinutes / SLOT_MINUTES;

  const hourMarkers = useMemo(() => {
    const marks = [];
    for (let h = startHour; h <= endHour; h++) marks.push(h);
    return marks;
  }, [startHour, endHour]);

  function minutesSinceStart(date: Date) {
    return date.getHours() * 60 + date.getMinutes() - startHour * 60;
  }

  function slotToTime(slot: number) {
    const mins = startHour * 60 + slot * SLOT_MINUTES;
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  const itemsByResource = new Map<string, ScheduleItem[]>();
  for (const r of resources) itemsByResource.set(r.id, []);
  for (const item of items) itemsByResource.get(item.resourceId)?.push(item);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <div className="min-w-[900px]">
        {/* Hour header */}
        <div className="grid border-b border-border" style={{ gridTemplateColumns: `160px repeat(${totalSlots}, minmax(28px, 1fr))` }}>
          <div className="sticky left-0 z-10 bg-card px-3 py-2 text-xs font-semibold text-muted-foreground">Resource</div>
          {hourMarkers.map((h, i) => (
            <div
              key={h}
              className="border-l border-border/60 py-2 text-[11px] text-muted-foreground"
              style={{ gridColumn: `span 2 / span 2` }}
            >
              {i < hourMarkers.length - 1 ? `${h % 24}:00` : ""}
            </div>
          ))}
        </div>

        {resources.map((resource) => {
          const resourceItems = itemsByResource.get(resource.id) ?? [];
          const occupiedSlots = new Set<number>();

          return (
            <div
              key={resource.id}
              className="grid border-b border-border last:border-b-0"
              style={{ gridTemplateColumns: `160px repeat(${totalSlots}, minmax(28px, 1fr))`, gridAutoRows: "48px" }}
            >
              <div className="sticky left-0 z-10 flex flex-col justify-center border-r border-border bg-card px-3 py-2">
                <p className="text-sm font-medium">{resource.name}</p>
                <p className="text-xs text-muted-foreground">{resource.activityName}</p>
              </div>

              {/* Background empty-slot click targets */}
              {Array.from({ length: totalSlots }, (_, slot) => slot).map((slot) => {
                if (occupiedSlots.has(slot)) return null;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => onEmptyClick?.(resource.id, slotToTime(slot))}
                    className="h-full border-l border-border/40 transition-colors hover:bg-gold/10"
                    style={{ gridColumn: `${slot + 2} / span 1`, gridRow: 1 }}
                    aria-label={`Book ${resource.name} at ${slotToTime(slot)}`}
                  />
                );
              })}

              {resourceItems.map((item) => {
                const startSlot = Math.floor(minutesSinceStart(item.startTime) / SLOT_MINUTES);
                const durationSlots = Math.max(1, Math.round((item.endTime.getTime() - item.startTime.getTime()) / 60000 / SLOT_MINUTES));
                const clampedStart = Math.max(0, startSlot);
                const clampedEnd = Math.min(totalSlots, startSlot + durationSlots);
                if (clampedEnd <= clampedStart) return null;
                for (let s = clampedStart; s < clampedEnd; s++) occupiedSlots.add(s);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onItemClick?.(item)}
                    className={cn(
                      "z-[1] m-0.5 flex flex-col justify-center overflow-hidden rounded-md px-2 py-1 text-left text-xs font-medium shadow-sm",
                      statusClasses(item)
                    )}
                    style={{ gridColumn: `${clampedStart + 2} / ${clampedEnd + 2}`, gridRow: 1 }}
                    title={`${item.label} ${item.subLabel ?? ""}`}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.subLabel && <span className="truncate text-[10px] opacity-70">{item.subLabel}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
