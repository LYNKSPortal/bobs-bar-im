"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { CalendarCheck, CalendarIcon, Clock, Loader2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatPrice } from "@/lib/pricing";
import { fetchAvailability } from "@/server/actions/availability";
import { cancelBookingByToken, rescheduleBookingByToken } from "@/server/actions/booking";

interface ManageBooking {
  reference: string;
  status: string;
  activityName: string;
  resourceName: string;
  startTime: string;
  durationMinutes: number;
  priceTotal: number;
  currency: string;
  activityId: string;
}

export function ManageBookingClient({
  token,
  booking,
  timezone,
  cancellationDeadlineHours,
}: {
  token: string;
  booking: ManageBooking;
  timezone: string;
  cancellationDeadlineHours: number;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(booking.status);
  const [cancelling, startCancel] = useTransition();

  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState<Date>(() => parseISO(booking.startTime));
  const [slots, setSlots] = useState<Awaited<ReturnType<typeof fetchAvailability>> | null>(null);
  const [loadingSlots, startLoadingSlots] = useTransition();
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  const deadline = new Date(parseISO(booking.startTime).getTime() - cancellationDeadlineHours * 60 * 60 * 1000);
  const pastDeadline = new Date() > deadline;
  const isCancelled = status === "CANCELLED";

  useEffect(() => {
    if (!rescheduling) return;
    startLoadingSlots(async () => {
      const result = await fetchAvailability({
        activityId: booking.activityId,
        date: format(newDate, "yyyy-MM-dd"),
        durationMinutes: booking.durationMinutes,
      });
      setSlots(result);
    });
  }, [rescheduling, newDate, booking.activityId, booking.durationMinutes]);

  function handleCancel() {
    startCancel(async () => {
      const result = await cancelBookingByToken(token);
      if (!result.ok) {
        toast.error(result.error ?? "Could not cancel booking.");
        return;
      }
      setStatus("CANCELLED");
      toast.success("Booking cancelled.");
    });
  }

  async function handleReschedule(time: string) {
    setSubmittingReschedule(true);
    const result = await rescheduleBookingByToken(token, { date: format(newDate, "yyyy-MM-dd"), startTime: time });
    setSubmittingReschedule(false);
    if (!result.ok) {
      toast.error(result.error ?? "Could not reschedule booking.");
      return;
    }
    toast.success("Booking updated.");
    router.refresh();
    setRescheduling(false);
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold">Manage your booking</h1>
      <p className="mt-2 text-muted-foreground">Reference {booking.reference}</p>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <p className="font-heading text-xl font-semibold">{booking.activityName}</p>
            <p className="text-sm text-muted-foreground">{booking.resourceName}</p>
          </div>
          <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold">
            {status}
          </span>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <CalendarCheck className="size-4 text-gold" />
            {format(parseISO(booking.startTime), "EEEE d MMMM yyyy")}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-gold" />
            {format(parseISO(booking.startTime), "h:mm a")} &middot; {booking.durationMinutes} minutes
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="font-heading text-lg font-bold text-gold">{formatPrice(booking.priceTotal, booking.currency)}</span>
        </div>
      </div>

      {!isCancelled && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" className="flex-1" onClick={() => setRescheduling((v) => !v)} disabled={pastDeadline}>
            {rescheduling ? "Close" : "Reschedule"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" className="flex-1" disabled={pastDeadline} />}>
              Cancel booking
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                <AlertDialogDescription>This cannot be undone. Your table will be released immediately.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep booking</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel} disabled={cancelling}>
                  {cancelling ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  Yes, cancel
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {pastDeadline && !isCancelled && (
        <p className="mt-3 text-sm text-muted-foreground">
          Online changes are closed within {cancellationDeadlineHours}h of your booking. Please call us to make changes.
        </p>
      )}

      {rescheduling && (
        <div className="mt-6 rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger render={<Button variant="outline" />}>
                <CalendarIcon className="mr-2 size-4" />
                {format(newDate, "EEE d MMM yyyy")}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newDate}
                  onSelect={(d) => d && setNewDate(d)}
                  disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="mt-4">
            {loadingSlots ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Checking availability...
              </div>
            ) : slots?.slots && slots.slots.filter((s) => s.available).length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {slots.slots
                  .filter((s) => s.available)
                  .map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => handleReschedule(slot.time)}
                      disabled={submittingReschedule}
                      className="rounded-lg border border-border px-2 py-2 text-sm font-medium hover:border-gold hover:bg-gold/10"
                    >
                      {slot.time}
                    </button>
                  ))}
              </div>
            ) : (
              <p className="py-4 text-sm text-muted-foreground">No availability on this date.</p>
            )}
          </div>
        </div>
      )}

      <p className="mt-8 text-xs text-muted-foreground" suppressHydrationWarning>
        Times shown in {timezone}.
      </p>
    </div>
  );
}
