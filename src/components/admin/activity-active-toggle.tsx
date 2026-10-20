"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { toggleActivityActive } from "@/server/actions/admin-activities";

export function ActivityActiveToggle({ activityId, active }: { activityId: string; active: boolean }) {
  const [checked, setChecked] = useState(active);
  const [, startTransition] = useTransition();

  function handleChange(value: boolean) {
    setChecked(value);
    startTransition(async () => {
      const result = await toggleActivityActive(activityId, value);
      if (!result.ok) {
        setChecked(!value);
        toast.error(result.error ?? "Could not update activity.");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{checked ? "Active" : "Inactive"}</span>
      <Switch checked={checked} onCheckedChange={handleChange} />
    </div>
  );
}
