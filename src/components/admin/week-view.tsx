import Link from "next/link";
import { addDays, format, isToday, startOfWeek } from "date-fns";

export function WeekView({ week, counts }: { week: Date; counts: Map<string, number> }) {
  const start = startOfWeek(week);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const count = counts.get(key) ?? 0;
        return (
          <Link
            key={key}
            href={`/admin/calendar?view=day&date=${key}`}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-shadow hover:shadow-md"
          >
            <span className="text-xs font-medium uppercase text-muted-foreground">{format(day, "EEE")}</span>
            <span className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold ${isToday(day) ? "bg-gold text-gold-foreground" : "bg-secondary"}`}>
              {format(day, "d")}
            </span>
            <span className="font-heading text-lg font-bold text-gold">{count}</span>
            <span className="text-xs text-muted-foreground">booking{count === 1 ? "" : "s"}</span>
          </Link>
        );
      })}
    </div>
  );
}
