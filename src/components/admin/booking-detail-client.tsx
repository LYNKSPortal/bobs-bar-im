"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, Loader2, UserCheck, XCircle } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/pricing";
import {
  cancelAdminBooking,
  markBookingArrived,
  rescheduleAdminBooking,
  updateBookingDetails,
  updateBookingStatusAction,
} from "@/server/actions/admin-bookings";

interface BookingDetail {
  id: string;
  reference: string;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  notes: string | null;
  partySize: number | null;
  startTime: string;
  durationMinutes: number;
  priceTotal: number;
  currency: string;
  resourceId: string;
  activity: { id: string; name: string };
  resource: { id: string; name: string };
  resources: { id: string; name: string }[];
  statusHistory: { id: string; status: string; note: string | null; changedAt: string; changedByName: string | null }[];
}

export function BookingDetailClient({ booking }: { booking: BookingDetail }) {
  const router = useRouter();
  const [name, setName] = useState(booking.customerName ?? "");
  const [email, setEmail] = useState(booking.customerEmail ?? "");
  const [phone, setPhone] = useState(booking.customerPhone ?? "");
  const [notes, setNotes] = useState(booking.notes ?? "");
  const [savingDetails, setSavingDetails] = useState(false);

  const [date, setDate] = useState<Date>(new Date(booking.startTime));
  const [startTime, setStartTime] = useState(format(new Date(booking.startTime), "HH:mm"));
  const [duration, setDuration] = useState(booking.durationMinutes);
  const [resourceId, setResourceId] = useState(booking.resourceId);
  const [rescheduling, setRescheduling] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  async function handleSaveDetails() {
    setSavingDetails(true);
    const result = await updateBookingDetails(booking.id, { customerName: name, customerEmail: email, customerPhone: phone, notes });
    setSavingDetails(false);
    if (!result.ok) return toast.error(result.error ?? "Could not save.");
    toast.success("Details updated.");
    router.refresh();
  }

  async function handleReschedule() {
    setRescheduling(true);
    const result = await rescheduleAdminBooking({
      bookingId: booking.id,
      date: format(date, "yyyy-MM-dd"),
      startTime,
      durationMinutes: duration,
      resourceId,
    });
    setRescheduling(false);
    if (!result.ok) return toast.error(result.error ?? "Could not reschedule.");
    toast.success("Booking rescheduled.");
    router.refresh();
  }

  async function handleAction(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setActionLoading(true);
    const result = await fn();
    setActionLoading(false);
    if (!result.ok) return toast.error(result.error ?? "Something went wrong.");
    toast.success("Updated.");
    router.refresh();
  }

  const isCancelled = booking.status === "CANCELLED";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Booking {booking.reference}</CardTitle>
            <Badge variant="secondary">{booking.status}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Activity</p>
                <p className="font-medium">{booking.activity.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Price</p>
                <p className="font-medium text-gold">{formatPrice(booking.priceTotal, booking.currency)}</p>
              </div>
            </div>

            {!isCancelled && (
              <div className="grid gap-3 border-t border-border pt-4">
                <p className="text-sm font-medium">Reschedule</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Popover>
                    <PopoverTrigger render={<Button type="button" variant="outline" className="justify-start font-normal" />}>
                      <CalendarIcon className="mr-2 size-4" />
                      {format(date, "d MMM")}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} autoFocus />
                    </PopoverContent>
                  </Popover>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  <Input
                    type="number"
                    min={15}
                    step={15}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  />
                  <Select
                    value={resourceId}
                    onValueChange={(v) => v && setResourceId(v)}
                    items={Object.fromEntries(booking.resources.map((r) => [r.id, r.name]))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {booking.resources.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" className="w-fit" onClick={handleReschedule} disabled={rescheduling}>
                  {rescheduling && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Save new time
                </Button>
              </div>
            )}

            {!isCancelled && (
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionLoading}
                  onClick={() => handleAction(() => markBookingArrived(booking.id))}
                >
                  <UserCheck className="mr-1.5 size-4" /> Mark arrived
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionLoading}
                  onClick={() => handleAction(() => updateBookingStatusAction(booking.id, "COMPLETED"))}
                >
                  <CheckCircle2 className="mr-1.5 size-4" /> Mark completed
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionLoading}
                  onClick={() => handleAction(() => updateBookingStatusAction(booking.id, "NO_SHOW"))}
                >
                  <XCircle className="mr-1.5 size-4" /> No-show
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger render={<Button size="sm" variant="destructive" />}>Cancel booking</AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                      <AlertDialogDescription>The table/resource will be released immediately.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep booking</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleAction(() => cancelAdminBooking(booking.id))}>
                        Yes, cancel
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
            <Button size="sm" className="w-fit" onClick={handleSaveDetails} disabled={savingDetails}>
              {savingDetails && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save details
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity history</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4 border-l border-border pl-4">
            {booking.statusHistory.map((event) => (
              <li key={event.id} className="relative text-sm">
                <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-gold" />
                <p className="font-medium">{event.status}</p>
                {event.note && <p className="text-muted-foreground">{event.note}</p>}
                <p className="text-xs text-muted-foreground">
                  {format(new Date(event.changedAt), "d MMM yyyy, h:mm a")}
                  {event.changedByName ? ` \u00b7 ${event.changedByName}` : ""}
                </p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
