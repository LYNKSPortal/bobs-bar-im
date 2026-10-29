"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createAdminBlock } from "@/server/actions/admin-blocks";

interface ActivityWithResources {
  id: string;
  name: string;
  resources: { id: string; name: string; status: string }[];
}

const REASONS = [
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "PRIVATE_EVENT", label: "Private event" },
  { value: "STAFF_USE", label: "Staff use" },
  { value: "RESERVED", label: "Reserved" },
  { value: "OTHER", label: "Other" },
] as const;

export function BlockTimeDialog({
  activities,
  defaultDate,
  defaultResourceId,
  defaultActivityId,
  defaultStartTime,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  activities: ActivityWithResources[];
  defaultDate?: Date;
  defaultResourceId?: string;
  defaultActivityId?: string;
  defaultStartTime?: string;
  trigger?: React.ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;

  const [scope, setScope] = useState<"resource" | "activity">("resource");
  const [activityId, setActivityId] = useState(defaultActivityId ?? activities[0]?.id ?? "");
  const [resourceId, setResourceId] = useState(defaultResourceId ?? "");
  const [date, setDate] = useState<Date>(defaultDate ?? new Date());
  const [startTime, setStartTime] = useState(defaultStartTime ?? "15:00");
  const [endTime, setEndTime] = useState(defaultStartTime ? addHour(defaultStartTime) : "18:00");
  const [reason, setReason] = useState<(typeof REASONS)[number]["value"]>("MAINTENANCE");
  const [note, setNote] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceUntil, setRecurrenceUntil] = useState<Date | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [conflicts, setConflicts] = useState<string[] | null>(null);

  const activity = useMemo(() => activities.find((a) => a.id === activityId), [activities, activityId]);
  const resources = activity?.resources.filter((r) => r.status !== "RETIRED") ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setConflicts(null);

    const result = await createAdminBlock({
      scope,
      resourceId: scope === "resource" ? resourceId || resources[0]?.id : undefined,
      activityId: scope === "activity" ? activityId : undefined,
      date: format(date, "yyyy-MM-dd"),
      startTime,
      endTime,
      reason,
      note,
      isRecurring,
      recurrenceUntil: recurrenceUntil ? format(recurrenceUntil, "yyyy-MM-dd") : undefined,
    });

    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error ?? "Could not create block.");
      if (result.conflicts) setConflicts(result.conflicts.map((c) => c.label));
      return;
    }

    toast.success("Time blocked.");
    setOpen(false);
    setNote("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger === undefined ? (
        <DialogTrigger render={<Button variant="outline" />}>
          <ShieldAlert className="mr-2 size-4" /> Block Time
        </DialogTrigger>
      ) : trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : null}
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Block time</DialogTitle>
            <DialogDescription>Make a table, simulator, or whole activity unavailable online.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Block</Label>
                <Select
                  value={scope}
                  onValueChange={(v) => v && setScope(v as "resource" | "activity")}
                  items={{ resource: "A specific resource", activity: "An entire activity" }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resource">A specific resource</SelectItem>
                    <SelectItem value="activity">An entire activity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Activity</Label>
                <Select
                  value={activityId}
                  onValueChange={(v) => {
                    if (!v) return;
                    setActivityId(v);
                    setResourceId("");
                  }}
                  items={Object.fromEntries(activities.map((a) => [a.id, a.name]))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activities.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {scope === "resource" && (
              <div className="grid gap-1.5">
                <Label>Resource</Label>
                <Select
                  value={resourceId || resources[0]?.id}
                  onValueChange={(v) => v && setResourceId(v)}
                  items={Object.fromEntries(resources.map((r) => [r.id, r.name]))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resources.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger render={<Button type="button" variant="outline" className="justify-start font-normal" />}>
                    <CalendarIcon className="mr-2 size-4" />
                    {format(date, "d MMM")}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} autoFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="blockStart">Start</Label>
                <Input id="blockStart" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="blockEnd">End</Label>
                <Input id="blockEnd" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>Reason</Label>
              <Select
                value={reason}
                onValueChange={(v) => v && setReason(v as typeof reason)}
                items={Object.fromEntries(REASONS.map((r) => [r.value, r.label]))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="blockNote">Note (optional)</Label>
              <Textarea id="blockNote" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
            </div>

            {scope === "resource" && (
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label htmlFor="recurring" className="text-sm">
                    Repeat weekly
                  </Label>
                  <p className="text-xs text-muted-foreground">e.g. every Monday at this time</p>
                </div>
                <Switch id="recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
              </div>
            )}

            {isRecurring && (
              <div className="grid gap-1.5">
                <Label>Repeat until</Label>
                <Popover>
                  <PopoverTrigger render={<Button type="button" variant="outline" className="justify-start font-normal" />}>
                    <CalendarIcon className="mr-2 size-4" />
                    {recurrenceUntil ? format(recurrenceUntil, "d MMM yyyy") : "No end date"}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={recurrenceUntil} onSelect={setRecurrenceUntil} autoFocus />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {conflicts && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <p className="font-medium">This overlaps existing bookings:</p>
                <ul className="mt-1 list-disc pl-4">
                  {conflicts.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter className="mt-5">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Block time
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function addHour(time: string) {
  const [h, m] = time.split(":").map(Number);
  const next = (h + 1) % 24;
  return `${String(next).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
