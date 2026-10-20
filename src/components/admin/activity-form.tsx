"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createActivity, updateActivity } from "@/server/actions/admin-activities";

interface ActivityInitial {
  id?: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  imageUrl: string;
  active: boolean;
  allowResourceSelection: boolean;
  durationsMinutes: number[];
  defaultDurationMinutes: number;
  minPartySize?: number;
  maxPartySize?: number;
  basePriceHourly: number;
  paymentMode: "NONE" | "DEPOSIT" | "FULL";
  depositPercent?: number;
}

const DEFAULTS: ActivityInitial = {
  name: "",
  slug: "",
  description: "",
  shortDescription: "",
  imageUrl: "",
  active: true,
  allowResourceSelection: false,
  durationsMinutes: [60],
  defaultDurationMinutes: 60,
  basePriceHourly: 2000,
  paymentMode: "NONE",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ActivityForm({ initial }: { initial?: ActivityInitial }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState<ActivityInitial>(initial ?? DEFAULTS);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [durationsText, setDurationsText] = useState((initial?.durationsMinutes ?? [60]).join(", "));
  const [priceDisplay, setPriceDisplay] = useState(((initial?.basePriceHourly ?? 2000) / 100).toString());
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof ActivityInitial>(key: K, value: ActivityInitial[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const durations = durationsText
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);

    const payload = {
      ...form,
      durationsMinutes: durations.length ? durations : [60],
      basePriceHourly: Math.round(Number(priceDisplay) * 100),
    };

    setSubmitting(true);
    const result = isEdit ? await updateActivity(initial!.id!, payload) : await createActivity(payload);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error ?? "Could not save activity.");
      return;
    }
    toast.success(isEdit ? "Activity updated." : "Activity created.");
    router.push(`/admin/activities/${result.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => {
            update("name", e.target.value);
            if (!slugTouched) update("slug", slugify(e.target.value));
          }}
          required
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="slug">URL slug</Label>
        <Input
          id="slug"
          value={form.slug}
          onChange={(e) => {
            setSlugTouched(true);
            update("slug", slugify(e.target.value));
          }}
          required
        />
        <p className="text-xs text-muted-foreground">bobsbar.com/activities/{form.slug || "your-activity"}</p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} required />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="shortDescription">Short description (for cards)</Label>
        <Input id="shortDescription" value={form.shortDescription} onChange={(e) => update("shortDescription", e.target.value)} maxLength={200} />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input id="imageUrl" value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} placeholder="https://..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="durations">Durations (minutes, comma separated)</Label>
          <Input id="durations" value={durationsText} onChange={(e) => setDurationsText(e.target.value)} placeholder="30, 60, 90" />
        </div>
        <div className="grid gap-1.5">
          <Label>Default duration</Label>
          <Select value={String(form.defaultDurationMinutes)} onValueChange={(v) => update("defaultDurationMinutes", Number(v))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {durationsText
                .split(",")
                .map((s) => Number(s.trim()))
                .filter((n) => Number.isFinite(n) && n > 0)
                .map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d} min
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="price">Base price per hour (£)</Label>
          <Input id="price" type="number" min={0} step="0.5" value={priceDisplay} onChange={(e) => setPriceDisplay(e.target.value)} required />
        </div>
        <div className="grid gap-1.5">
          <Label>Payment</Label>
          <Select value={form.paymentMode} onValueChange={(v) => update("paymentMode", v as ActivityInitial["paymentMode"])}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Pay at venue</SelectItem>
              <SelectItem value="DEPOSIT">Deposit online</SelectItem>
              <SelectItem value="FULL">Full payment online</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {form.paymentMode === "DEPOSIT" && (
        <div className="grid gap-1.5">
          <Label htmlFor="depositPercent">Deposit percentage</Label>
          <Input
            id="depositPercent"
            type="number"
            min={1}
            max={100}
            value={form.depositPercent ?? 20}
            onChange={(e) => update("depositPercent", Number(e.target.value))}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="minParty">Min party size (optional)</Label>
          <Input
            id="minParty"
            type="number"
            min={1}
            value={form.minPartySize ?? ""}
            onChange={(e) => update("minPartySize", e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="maxParty">Max party size (optional)</Label>
          <Input
            id="maxParty"
            type="number"
            min={1}
            value={form.maxPartySize ?? ""}
            onChange={(e) => update("maxPartySize", e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <Label className="text-sm">Let customers choose the exact table/simulator</Label>
          <p className="text-xs text-muted-foreground">Otherwise we auto-assign the first available resource.</p>
        </div>
        <Switch checked={form.allowResourceSelection} onCheckedChange={(v) => update("allowResourceSelection", v)} />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <Label className="text-sm">Active (visible for online booking)</Label>
        <Switch checked={form.active} onCheckedChange={(v) => update("active", v)} />
      </div>

      <Button type="submit" className="w-fit bg-gold text-gold-foreground hover:bg-gold/90" disabled={submitting}>
        {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
        {isEdit ? "Save changes" : "Create activity"}
      </Button>
    </form>
  );
}
