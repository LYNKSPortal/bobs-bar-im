"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createResource, updateResourceStatus } from "@/server/actions/admin-activities";

interface Resource {
  id: string;
  name: string;
  status: "ACTIVE" | "UNAVAILABLE" | "MAINTENANCE" | "RETIRED";
}

const STATUS_OPTIONS = ["ACTIVE", "UNAVAILABLE", "MAINTENANCE", "RETIRED"] as const;

function statusVariant(status: string) {
  if (status === "ACTIVE") return "default";
  if (status === "RETIRED") return "secondary";
  return "outline";
}

export function ResourceManager({ activityId, resources }: { activityId: string; resources: Resource[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    const result = await createResource({ activityId, name: newName.trim(), status: "ACTIVE" });
    setAdding(false);
    if (!result.ok) return toast.error(result.error ?? "Could not add resource.");
    setNewName("");
    toast.success("Resource added.");
    router.refresh();
  }

  async function handleStatusChange(id: string, status: (typeof STATUS_OPTIONS)[number]) {
    const result = await updateResourceStatus(id, status);
    if (!result.ok) return toast.error(result.error ?? "Could not update resource.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {resources.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-3">
              <span className="font-medium">{r.name}</span>
              <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
            </div>
            <Select value={r.status} onValueChange={(v) => handleStatusChange(r.id, v as (typeof STATUS_OPTIONS)[number])}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        {resources.length === 0 && <p className="text-sm text-muted-foreground">No resources yet.</p>}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input placeholder="e.g. Pool Table 4" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Button type="submit" disabled={adding}>
          {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add
        </Button>
      </form>
    </div>
  );
}
