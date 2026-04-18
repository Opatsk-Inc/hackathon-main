import { HeadDesktopLayout } from "@/components/layouts";

export function DashboardPage() {
  return (
    <HeadDesktopLayout currentPath="/head/dashboard">
      <div className="mx-auto w-full max-w-screen-2xl space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">
            General statistics and key metrics
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Total Records
              </p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Discrepancies
              </p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Active Tasks
              </p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Resolved
              </p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b p-6">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">
              Recent changes in the system
            </p>
          </div>
          <div className="p-6">
            <p className="text-sm text-muted-foreground">
              No data loaded yet
            </p>
          </div>
        </div>
      </div>
    </HeadDesktopLayout>
  );
}
