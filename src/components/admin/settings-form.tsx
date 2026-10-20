"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBusinessSettings } from "@/server/actions/admin-settings";

interface Settings {
  businessName: string;
  addressLine: string;
  phone: string;
  email: string;
  timezone: string;
  currency: string;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
  bufferMinutes: number;
  slotIntervalMinutes: number;
  cancellationDeadlineHours: number;
  facebookUrl: string;
  instagramUrl: string;
}

export function SettingsForm({ initial }: { initial: Settings }) {
  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await updateBusinessSettings(form);
    setSubmitting(false);
    if (!result.ok) return toast.error(result.error ?? "Could not save settings.");
    toast.success("Settings saved.");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label>Business name</Label>
          <Input value={form.businessName} onChange={(e) => update("businessName", e.target.value)} required />
        </div>
        <div className="grid gap-1.5">
          <Label>Timezone (IANA)</Label>
          <Input value={form.timezone} onChange={(e) => update("timezone", e.target.value)} required />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label>Address</Label>
        <Input value={form.addressLine} onChange={(e) => update("addressLine", e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label>Facebook URL</Label>
          <Input value={form.facebookUrl} onChange={(e) => update("facebookUrl", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>Instagram URL</Label>
          <Input value={form.instagramUrl} onChange={(e) => update("instagramUrl", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label>Min advance notice (minutes)</Label>
          <Input type="number" min={0} value={form.minAdvanceMinutes} onChange={(e) => update("minAdvanceMinutes", Number(e.target.value))} />
        </div>
        <div className="grid gap-1.5">
          <Label>Max advance booking (days)</Label>
          <Input type="number" min={1} value={form.maxAdvanceDays} onChange={(e) => update("maxAdvanceDays", Number(e.target.value))} />
        </div>
        <div className="grid gap-1.5">
          <Label>Buffer between bookings (min)</Label>
          <Input type="number" min={0} value={form.bufferMinutes} onChange={(e) => update("bufferMinutes", Number(e.target.value))} />
        </div>
        <div className="grid gap-1.5">
          <Label>Slot interval (minutes)</Label>
          <Input type="number" min={5} value={form.slotIntervalMinutes} onChange={(e) => update("slotIntervalMinutes", Number(e.target.value))} />
        </div>
        <div className="grid gap-1.5">
          <Label>Cancellation deadline (hours)</Label>
          <Input
            type="number"
            min={0}
            value={form.cancellationDeadlineHours}
            onChange={(e) => update("cancellationDeadlineHours", Number(e.target.value))}
          />
        </div>
      </div>

      <Button type="submit" className="w-fit bg-gold text-gold-foreground hover:bg-gold/90" disabled={submitting}>
        {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
        Save settings
      </Button>
    </form>
  );
}
