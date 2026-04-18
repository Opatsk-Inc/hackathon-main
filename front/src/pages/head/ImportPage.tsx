import { HeadDesktopLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export function ImportPage() {
  return (
    <HeadDesktopLayout currentPath="/head/import">
      <div className="mx-auto w-full max-w-screen-2xl space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import Data</h1>
          <p className="text-muted-foreground">
            Upload property and land cadastre registries
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="border-b p-6">
              <h3 className="text-lg font-semibold">Property Registry</h3>
              <p className="text-sm text-muted-foreground">
                Upload file with property data
              </p>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
                <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-2 text-sm font-medium">
                  Drag file here or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported formats: CSV, XLSX
                </p>
                <Button className="mt-4">Select File</Button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card shadow-sm">
            <div className="border-b p-6">
              <h3 className="text-lg font-semibold">Land Cadastre</h3>
              <p className="text-sm text-muted-foreground">
                Upload file with land cadastre data
              </p>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
                <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-2 text-sm font-medium">
                  Drag file here or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported formats: CSV, XLSX
                </p>
                <Button className="mt-4">Select File</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b p-6">
            <h3 className="text-lg font-semibold">Upload History</h3>
            <p className="text-sm text-muted-foreground">
              Recently imported files
            </p>
          </div>
          <div className="p-6">
            <p className="text-sm text-muted-foreground">
              No files uploaded yet
            </p>
          </div>
        </div>
      </div>
    </HeadDesktopLayout>
  );
}
