import Link from "next/link";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export function MonthView({ month, counts }: { month: Date; counts: Map<string, number> }) {
  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));

  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border bg-secondary/50 text-center text-xs font-semibold text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const count = counts.get(key) ?? 0;
          return (
            <Link
              key={key}
              href={`/admin/calendar?view=day&date=${key}`}
              className={`flex min-h-24 flex-col gap-1 border-b border-r border-border p-2 transition-colors hover:bg-gold/10 ${
                isSameMonth(day, month) ? "" : "bg-secondary/20 text-muted-foreground"
              }`}
            >
              <span className={`text-xs font-medium ${isToday(day) ? "flex size-5 items-center justify-center rounded-full bg-gold text-gold-foreground" : ""}`}>
                {format(day, "d")}
              </span>
              {count > 0 && (
                <span className="mt-auto inline-flex w-fit items-center rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-medium text-gold">
                  {count} booking{count === 1 ? "" : "s"}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
