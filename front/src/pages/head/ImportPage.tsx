import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HeadDesktopLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  Package,
  Sparkles,
} from "lucide-react";
import { AdminService } from "@/lib/api/admin.service";

export function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: batches, isLoading: batchesLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: () => AdminService.getBatches(),
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Файл не вибрано");
      return AdminService.importRealEstate(file);
    },
    onSuccess: () => {
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['discrepancies'] });
    },
  });

  const fixEncoding = (str: any) => {
    if (!str) return str;
    try {
      return decodeURIComponent(escape(str));
    } catch (e: any) {
      console.log(e);
      return str;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      const name = droppedFile.name.toLowerCase();
      if (name.endsWith('.csv') || name.endsWith('.xlsx')) {
        setFile(droppedFile);
      } else {
        alert("Будь ласка, завантажте файл у форматі CSV або XLSX");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <HeadDesktopLayout currentPath="/head/import">
      <div className="mx-auto w-full max-w-screen-full space-y-6 p-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.02em] text-slate-900">
            Імпорт даних
          </h1>
          <p className="text-sm text-slate-500">
            Завантажте реєстр нерухомості для проведення аудиту
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/60 shadow-[0_1px_2px_rgba(11,28,54,0.04),0_18px_40px_rgba(11,28,54,0.08)] backdrop-blur-2xl">
          <div className="border-b border-white/60 p-6">
            <h3 className="font-heading text-lg font-semibold tracking-[-0.02em] text-slate-900">
              Реєстр нерухомості
            </h3>
            <p className="mt-0.5 text-sm text-slate-500">
              Завантажте файл з даними про нерухомість для звірки
            </p>
          </div>
          <div className="space-y-6 p-6">
            {!file ? (
              <div
                className={`group/drop flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
                  isDragging
                    ? "border-amber-400 bg-amber-50/80 shadow-[0_20px_60px_rgba(217,119,6,0.14)]"
                    : "border-amber-200/80 bg-white/50 hover:border-amber-300 hover:bg-amber-50/40"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div
                  className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${
                    isDragging
                      ? "bg-amber-500 text-white shadow-[0_12px_32px_rgba(217,119,6,0.35)]"
                      : "bg-amber-100/80 text-amber-700 ring-1 ring-amber-200/70 group-hover/drop:bg-amber-200/80"
                  }`}
                >
                  <Upload className="h-7 w-7" />
                </div>
                <p className="mb-1 text-sm font-semibold text-slate-900">
                  Перетягніть файл сюди або натисніть для вибору
                </p>
                <p className="text-xs text-slate-500">Підтримувані формати: CSV, XLSX</p>
                <Button
                  type="button"
                  className="mt-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Вибрати файл
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur-xl">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100/80 ring-1 ring-amber-200/70">
                    <FileText className="h-5 w-5 text-amber-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setFile(null)}
                  className="shrink-0 text-slate-400 hover:text-rose-600"
                  title="Видалити файл"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChange}
            />

            {importMutation.isError && (
              <div className="flex items-center gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/80 p-4 text-sm text-rose-700 backdrop-blur-xl">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>
                  {importMutation.error instanceof Error
                    ? importMutation.error.message
                    : "Помилка завантаження файлу"}
                </p>
              </div>
            )}

            {importMutation.isSuccess && (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-4 text-sm text-emerald-700 backdrop-blur-xl">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <p>Файл успішно завантажено та передано на обробку. Аналіз розпочато.</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                size="lg"
                className="w-full gap-2 sm:w-auto"
                disabled={!file || importMutation.isPending}
                onClick={() => importMutation.mutate()}
              >
                <Sparkles className="h-4 w-4" />
                {importMutation.isPending ? "Завантаження..." : "Завантажити та розпочати аналіз"}
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/60 shadow-[0_1px_2px_rgba(11,28,54,0.04),0_18px_40px_rgba(11,28,54,0.08)] backdrop-blur-2xl">
          <div className="border-b border-white/60 p-6">
            <h3 className="font-heading text-lg font-semibold tracking-[-0.02em] text-slate-900">
              Історія завантажень
            </h3>
            <p className="mt-0.5 text-sm text-slate-500">
              Останні імпортовані файли та результати звірки
            </p>
          </div>
          <div className="divide-y divide-white/60">
            {batchesLoading ? (
              <div className="p-6 text-sm text-slate-500">Завантаження...</div>
            ) : !batches || batches.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">Файли ще не завантажувались</div>
            ) : (
              batches.map((batch) => (
                <div
                  key={batch.id}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-amber-50/30"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100/80 ring-1 ring-sky-200/70">
                    <Package className="h-5 w-5 text-sky-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {fixEncoding(batch.fileName)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      <span className="font-mono tabular-nums">{batch.rowsCount}</span> записів ·
                      {" "}
                      <span className="font-mono tabular-nums text-amber-700">
                        {batch.anomalyCount ?? 0}
                      </span>{" "}
                      аномалій
                    </p>
                  </div>
                  <div className="shrink-0 text-xs text-slate-500 tabular-nums">
                    {new Date(batch.createdAt).toLocaleString('uk-UA', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </HeadDesktopLayout>
  );
}
