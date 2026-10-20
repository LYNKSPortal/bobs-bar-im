"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarCheck, Loader2, PartyPopper } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/pricing";
import { submitBooking } from "@/server/actions/booking";
import type { ActiveActivity } from "@/server/data/activities";

export function BookingDetailsDialog({
  open,
  onOpenChange,
  activity,
  date,
  time,
  durationMinutes,
  price,
  currency,
  availableResourceIds,
  partySize,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: ActiveActivity;
  date: Date;
  time: string;
  durationMinutes: number;
  price: number;
  currency: string;
  availableResourceIds: string[];
  partySize?: number;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [resourceId, setResourceId] = useState<string | undefined>(
    activity.allowResourceSelection ? availableResourceIds[0] : undefined
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ reference: string; manageToken: string } | null>(null);

  const resources = activity.resources.filter((r) => availableResourceIds.includes(r.id));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await submitBooking({
      activityId: activity.id,
      resourceId: activity.allowResourceSelection ? resourceId : undefined,
      date: format(date, "yyyy-MM-dd"),
      startTime: time,
      durationMinutes,
      partySize,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      notes,
    });

    if (!result.ok) {
      setSubmitting(false);
      setError(result.error ?? "Something went wrong.");
      toast.error(result.error ?? "Something went wrong.");
      return;
    }

    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
      return;
    }

    setSubmitting(false);
    setSuccess({ reference: result.reference!, manageToken: result.manageToken! });
  }

  function handleClose(next: boolean) {
    onOpenChange(next);
    if (!next && success) {
      router.push(`/booking/confirmation/${success.reference}?t=${success.manageToken}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {success ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-accent/20 text-accent-foreground">
              <PartyPopper className="size-7 text-gold" />
            </span>
            <DialogTitle className="font-heading text-2xl">Booking confirmed!</DialogTitle>
            <DialogDescription>
              Reference <span className="font-mono font-semibold text-foreground">{success.reference}</span>. A
              confirmation has been noted on your booking{email ? " and emailed to you" : ""}.
            </DialogDescription>
            <Button
              className="mt-2 w-full bg-gold text-gold-foreground hover:bg-gold/90"
              onClick={() => handleClose(false)}
            >
              <CalendarCheck className="mr-2 size-4" /> View booking details
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Confirm your booking</DialogTitle>
              <DialogDescription>Review the details and enter your contact information.</DialogDescription>
            </DialogHeader>

            <div className="mt-4 rounded-lg bg-muted p-4 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Activity</span>
                <span className="font-medium">{activity.name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{format(date, "EEEE d MMMM yyyy")}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">
                  {time} &middot; {durationMinutes} min
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold text-gold">{formatPrice(price, currency)}</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {activity.allowResourceSelection && resources.length > 1 && (
                <div className="grid gap-1.5">
                  <Label>Choose a table</Label>
                  <Select value={resourceId} onValueChange={(v) => v && setResourceId(v)}>
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

              <div className="grid gap-1.5">
                <Label htmlFor="customerName">Full name</Label>
                <Input id="customerName" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input id="customerEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input id="customerPhone" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={32} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={1000} />
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

            <DialogFooter className="mt-5">
              <Button type="submit" className="w-full bg-gold text-gold-foreground hover:bg-gold/90" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Confirm booking &middot; {formatPrice(price, currency)}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
