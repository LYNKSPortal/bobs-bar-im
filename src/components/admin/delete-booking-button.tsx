"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteAdminBooking } from "@/server/actions/admin-bookings";

export function DeleteBookingButton({
  bookingId,
  reference,
  onDeleted,
}: {
  bookingId: string;
  reference: string;
  onDeleted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteAdminBooking(bookingId);
    setDeleting(false);
    if (!result.ok) {
      toast.error(result.error ?? "Something went wrong.");
      return;
    }
    toast.success(`Booking ${reference} deleted.`);
    setOpen(false);
    onDeleted?.();
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        title="Delete booking"
        className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
      >
        <Trash2 className="size-4" />
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete booking {reference}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the booking and its history &mdash; useful for cleaning up test bookings. This
            can&rsquo;t be undone, and no email is sent to the customer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
