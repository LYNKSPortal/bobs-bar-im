"use client";

import { useState } from "react";
import { Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { approveBooking, declineBooking } from "@/server/actions/admin-bookings";

export function ApproveDeclineButtons({ bookingId, reference }: { bookingId: string; reference: string }) {
  const [open, setOpen] = useState<"approve" | "decline" | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue() {
    if (!open) return;
    setSubmitting(true);
    const result =
      open === "approve" ? await approveBooking(bookingId, note.trim() || undefined) : await declineBooking(bookingId, note.trim() || undefined);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error ?? "Something went wrong.");
      return;
    }
    toast.success(open === "approve" ? "Booking approved and customer notified." : "Booking declined and customer notified.");
    setOpen(null);
    setNote("");
  }

  return (
    <>
      <div className="flex gap-1.5">
        <Button
          type="button"
          size="sm"
          className="bg-green-600 text-white hover:bg-green-700"
          onClick={(e) => {
            e.stopPropagation();
            setOpen("approve");
          }}
        >
          <ThumbsUp className="mr-1.5 size-3.5" /> Approve
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-destructive/40 text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation();
            setOpen("decline");
          }}
        >
          <ThumbsDown className="mr-1.5 size-3.5" /> Decline
        </Button>
      </div>

      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {open === "approve" ? "Approve booking" : "Decline booking"} &middot; {reference}
            </DialogTitle>
            <DialogDescription>
              {open === "approve"
                ? "The customer will get an email confirming this booking is all good to go."
                : "The customer will get an email letting them know we can't go with that time."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 grid gap-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder={
                open === "approve"
                  ? "Add anything you'd like included in the email..."
                  : "e.g. Sorry, unfortunately we can't go with that time."
              }
            />
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              onClick={handleContinue}
              disabled={submitting}
              className={open === "approve" ? "w-full bg-green-600 text-white hover:bg-green-700" : "w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"}
            >
              {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
