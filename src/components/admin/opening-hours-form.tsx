"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { updateOpeningHours, type OpeningHourInput } from "@/server/actions/admin-settings";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function OpeningHoursForm({ initial }: { initial: OpeningHourInput[] }) {
  const [days, setDays] = useState(initial);
  const [submitting, setSubmitting] = useState(false);

  function update(dayOfWeek: number, patch: Partial<OpeningHourInput>) {
    setDays((d) => d.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await updateOpeningHours(days);
    setSubmitting(false);
    if (!result.ok) return toast.error(result.error ?? "Could not save hours.");
    toast.success("Opening hours saved.");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      {days
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
        .map((day) => (
          <div key={day.dayOfWeek} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
            <span className="w-28 text-sm font-medium">{DAY_NAMES[day.dayOfWeek]}</span>
            <Switch checked={!day.isClosed} onCheckedChange={(v) => update(day.dayOfWeek, { isClosed: !v })} />
            {day.isClosed ? (
              <span className="text-sm text-muted-foreground">Closed</span>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={day.openTime}
                  onChange={(e) => update(day.dayOfWeek, { openTime: e.target.value })}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={day.closeTime}
                  onChange={(e) => update(day.dayOfWeek, { closeTime: e.target.value })}
                  className="w-32"
                />
              </div>
            )}
          </div>
        ))}

      <Button type="submit" className="mt-2 w-fit" disabled={submitting}>
        {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
        Save opening hours
      </Button>
    </form>
  );
}
