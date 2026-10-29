"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, CalendarOff, Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { blockFullDayAction } from "@/server/actions/admin-blocks";

const REASONS = [
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "PRIVATE_EVENT", label: "Private event" },
  { value: "STAFF_USE", label: "Staff use" },
  { value: "RESERVED", label: "Reserved" },
  { value: "OTHER", label: "Other (e.g. public holiday)" },
] as const;

export function BlockFullDayDialog({ defaultDate }: { defaultDate?: Date }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(defaultDate ?? new Date());
  const [reason, setReason] = useState<(typeof REASONS)[number]["value"]>("OTHER");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [conflicts, setConflicts] = useState<string[] | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setConflicts(null);
    const result = await blockFullDayAction({ date: format(date, "yyyy-MM-dd"), reason, note: note || undefined });
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error ?? "Could not close this day.");
      if (result.conflicts) setConflicts(result.conflicts.map((c) => c.label));
      return;
    }

    toast.success("Day closed to online bookings.");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <CalendarOff className="mr-2 size-4" /> Block Full Day
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Close the venue for a day</DialogTitle>
            <DialogDescription>No online bookings will be accepted for the selected date.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-3">
            <div className="grid gap-1.5">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger render={<Button type="button" variant="outline" className="justify-start font-normal" />}>
                  <CalendarIcon className="mr-2 size-4" />
                  {format(date, "EEEE d MMMM yyyy")}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} autoFocus />
                </PopoverContent>
              </Popover>
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
              <Label htmlFor="dayNote">Note (optional)</Label>
              <Textarea id="dayNote" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
            </div>

            {conflicts && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <p className="font-medium">This day already has bookings:</p>
                <ul className="mt-1 list-disc pl-4">
                  {conflicts.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter className="mt-5">
            <Button type="submit" variant="destructive" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Close this day
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
