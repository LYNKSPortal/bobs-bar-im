"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CalendarNav({ date, view }: { date: string; view: "day" | "week" | "month" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = parseISO(date);

  function navigate(nextDate: Date, nextView = view) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", format(nextDate, "yyyy-MM-dd"));
    params.set("view", nextView);
    router.push(`/admin/calendar?${params.toString()}`);
  }

  function shift(amount: number) {
    const next = new Date(current);
    if (view === "day") next.setDate(next.getDate() + amount);
    else if (view === "week") next.setDate(next.getDate() + amount * 7);
    else next.setMonth(next.getMonth() + amount);
    navigate(next);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => shift(-1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" onClick={() => navigate(new Date())}>
          Today
        </Button>
        <Button variant="outline" size="icon" onClick={() => shift(1)}>
          <ChevronRight className="size-4" />
        </Button>

        <Popover>
          <PopoverTrigger render={<Button variant="outline" className="font-normal" />}>
            <CalendarIcon className="mr-2 size-4" />
            {format(current, "EEEE d MMMM yyyy")}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={current} onSelect={(d) => d && navigate(d)} autoFocus />
          </PopoverContent>
        </Popover>
      </div>

      <Tabs value={view} onValueChange={(v) => navigate(current, v as typeof view)}>
        <TabsList>
          <TabsTrigger value="day">Day</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
