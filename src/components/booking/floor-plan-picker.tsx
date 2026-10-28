"use client";

import { DoorOpen, Martini } from "lucide-react";

import { cn } from "@/lib/utils";

export interface FloorPlanResource {
  id: string;
  name: string;
  mapX: number | null;
  mapY: number | null;
  mapW: number | null;
  mapH: number | null;
  mapRotation: number | null;
  mapLabel: string | null;
}

export interface FloorPlanMarker {
  label: string;
  x: number;
  y: number;
}

function markerIcon(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes("entrance") || lower.includes("door")) return DoorOpen;
  if (lower.includes("bar")) return Martini;
  return null;
}

export function FloorPlanPicker({
  resources,
  markers,
  availableResourceIds,
  selectedResourceId,
  onSelect,
  className,
}: {
  resources: FloorPlanResource[];
  markers?: FloorPlanMarker[] | null;
  /** When omitted, every table is shown as selectable (no date/time chosen yet). */
  availableResourceIds?: string[];
  selectedResourceId?: string;
  onSelect: (resourceId: string) => void;
  className?: string;
}) {
  const placed = resources.filter((r) => r.mapX != null && r.mapY != null);

  return (
    <div
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-dashed border-border bg-[radial-gradient(circle,theme(colors.muted)_1px,transparent_1px)] bg-[length:16px_16px] bg-secondary/30 sm:aspect-[16/10]",
        className
      )}
    >
      {markers?.map((marker) => {
        const Icon = markerIcon(marker.label);
        return (
          <div
            key={marker.label}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs"
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
          >
            {Icon && (
              <span className="flex size-7 items-center justify-center rounded-full bg-ink text-gold shadow-sm">
                <Icon className="size-3.5" />
              </span>
            )}
            <span>{marker.label}</span>
          </div>
        );
      })}

      {placed.map((resource) => {
        const isAvailable = !availableResourceIds || availableResourceIds.includes(resource.id);
        const isSelected = selectedResourceId === resource.id;
        const w = resource.mapW ?? 14;
        const h = resource.mapH ?? 10;

        return (
          <button
            key={resource.id}
            type="button"
            disabled={!isAvailable}
            onClick={() => onSelect(resource.id)}
            title={`${resource.name}${isAvailable ? "" : " \u2014 unavailable"}`}
            className={cn(
              "group absolute flex items-center justify-center rounded-md border-2 text-[10px] font-semibold shadow-sm transition-all sm:text-xs",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isAvailable
                ? "cursor-pointer border-gold/60 bg-gold/15 text-foreground hover:scale-[1.04] hover:bg-gold/30 hover:shadow-md"
                : "cursor-not-allowed border-muted-foreground/30 bg-muted text-muted-foreground/60",
              isSelected && "scale-[1.06] border-gold bg-gold text-gold-foreground shadow-lg ring-2 ring-gold/50"
            )}
            style={{
              left: `${resource.mapX}%`,
              top: `${resource.mapY}%`,
              width: `${w}%`,
              height: `${h}%`,
              transform: `translate(-50%, -50%) rotate(${resource.mapRotation ?? 0}deg)`,
            }}
          >
            <span className="px-1 text-center leading-tight">{resource.mapLabel || resource.name}</span>
          </button>
        );
      })}
    </div>
  );
}
