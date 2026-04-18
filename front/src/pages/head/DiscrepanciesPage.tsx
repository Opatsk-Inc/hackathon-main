import { HeadDesktopLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";

export function DiscrepanciesPage() {
  return (
    <HeadDesktopLayout currentPath="/head/discrepancies">
      <div className="mx-auto w-full space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Discrepancies</h1>
            <p className="text-muted-foreground">
              Detected inconsistencies between registries
            </p>
          </div>
          <Button>Export</Button>
        </div>

        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-4">
              <input
                type="search"
                placeholder="Search..."
                className="rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No discrepancies found. Upload data for analysis.
            </p>
          </div>
        </div>
      </div>
    </HeadDesktopLayout>
  );
}
