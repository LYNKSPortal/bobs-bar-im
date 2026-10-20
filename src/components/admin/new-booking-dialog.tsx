"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarPlus, Loader2 } from "lucide-react";
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
import { CalendarIcon } from "lucide-react";
import { createAdminBooking } from "@/server/actions/admin-bookings";

interface ActivityWithResources {
  id: string;
  name: string;
  durationsMinutes: number[];
  resources: { id: string; name: string; status: string }[];
}

export function NewBookingDialog({
  activities,
  defaultDate,
  defaultActivityId,
  defaultResourceId,
  defaultStartTime,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  activities: ActivityWithResources[];
  defaultDate?: Date;
  defaultActivityId?: string;
  defaultResourceId?: string;
  defaultStartTime?: string;
  trigger?: React.ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;

  const [activityId, setActivityId] = useState(defaultActivityId ?? activities[0]?.id ?? "");
  const [resourceId, setResourceId] = useState(defaultResourceId ?? "");
  const [date, setDate] = useState<Date>(defaultDate ?? new Date());
  const [startTime, setStartTime] = useState(defaultStartTime ?? "14:00");
  const [endTime, setEndTime] = useState(defaultStartTime ? addHour(defaultStartTime) : "15:00");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [sendConfirmation, setSendConfirmation] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const activity = useMemo(() => activities.find((a) => a.id === activityId), [activities, activityId]);
  const resources = activity?.resources.filter((r) => r.status === "ACTIVE") ?? [];

  const durationMinutes = diffMinutes(startTime, endTime);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (durationMinutes <= 0) {
      toast.error("End time must be after start time.");
      return;
    }
    setSubmitting(true);
    const result = await createAdminBooking({
      activityId,
      resourceId: resourceId || activity?.resources[0]?.id,
      date: format(date, "yyyy-MM-dd"),
      startTime,
      durationMinutes,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      notes,
      sendConfirmation,
    });
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error ?? "Could not create booking.");
      return;
    }

    toast.success("Booking created.");
    setOpen(false);
    setName("");
    setEmail("");
    setPhone("");
    setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger === undefined ? (
        <DialogTrigger render={<Button className="bg-gold text-gold-foreground hover:bg-gold/90" />}>
          <CalendarPlus className="mr-2 size-4" /> New Booking
        </DialogTrigger>
      ) : trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : null}
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New booking</DialogTitle>
            <DialogDescription>For walk-ins or phone bookings. Customer details are optional.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Activity</Label>
                <Select
                  value={activityId}
                  onValueChange={(v) => {
                    if (!v) return;
                    setActivityId(v);
                    setResourceId("");
                  }}
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
              <div className="grid gap-1.5">
                <Label>Resource</Label>
                <Select value={resourceId || resources[0]?.id} onValueChange={(v) => v && setResourceId(v)}>
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
            </div>

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
                <Label htmlFor="startTime">Start</Label>
                <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="endTime">End</Label>
                <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
            </div>
            {durationMinutes > 0 && <p className="text-xs text-muted-foreground">Duration: {durationMinutes} minutes</p>}

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="name">Customer name (optional)</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>

            {email && (
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="sendConfirmation" className="text-sm">
                  Send confirmation email
                </Label>
                <Switch id="sendConfirmation" checked={sendConfirmation} onCheckedChange={setSendConfirmation} />
              </div>
            )}
          </div>

          <DialogFooter className="mt-5">
            <Button type="submit" className="w-full bg-gold text-gold-foreground hover:bg-gold/90" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Create booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function diffMinutes(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff <= 0) diff += 24 * 60;
  return diff;
}

function addHour(time: string) {
  const [h, m] = time.split(":").map(Number);
  const next = (h + 1) % 24;
  return `${String(next).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
