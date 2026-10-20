import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/pricing";
import { getReportsSummary } from "@/server/data/reports";

export default async function AdminReportsPage() {
  const report = await getReportsSummary(30);
  const maxCount = Math.max(1, ...report.activityBreakdown.map((a) => a.count));

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Reports</h1>
        <p className="text-sm text-muted-foreground">Last {report.days} days</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total bookings" value={report.totalBookings} />
        <StatCard label="Revenue" value={formatPrice(report.revenue, report.currency)} />
        <StatCard label="Cancellation rate" value={`${report.cancellationRate.toFixed(1)}%`} />
        <StatCard label="No-shows" value={report.noShows} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity popularity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.activityBreakdown.length === 0 && <p className="text-sm text-muted-foreground">No bookings yet in this period.</p>}
          {report.activityBreakdown.map((a) => (
            <div key={a.name}>
              <div className="flex justify-between text-sm">
                <span className="font-medium">{a.name}</span>
                <span className="text-muted-foreground">
                  {a.count} bookings &middot; {formatPrice(a.revenue, report.currency)}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-gold" style={{ width: `${(a.count / maxCount) * 100}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booking source</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="font-heading text-2xl font-bold text-gold">{report.bySource.online}</p>
            <p className="text-sm text-muted-foreground">Online</p>
          </div>
          <div>
            <p className="font-heading text-2xl font-bold text-gold">{report.bySource.manual}</p>
            <p className="text-sm text-muted-foreground">Manual / phone / walk-in</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="font-heading text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
