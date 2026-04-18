import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HeadDesktopLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, AlertCircle, CheckCircle2, Package } from "lucide-react";
import { AdminService } from "@/lib/api/admin.service";

export function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [taxRate, setTaxRate] = useState<string>("100");
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
      return AdminService.importRealEstate(file, Number(taxRate) || 100);
    },
    onSuccess: () => {
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    }
  });

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
      // Check extension
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
      <div className="mx-auto w-full max-w-screen-2xl space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Імпорт даних</h1>
          <p className="text-muted-foreground">
            Завантажте реєстр нерухомості для проведення аудиту
          </p>
        </div>

        <div className="max-w-2xl">
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="border-b p-6">
              <h3 className="text-lg font-semibold">Реєстр нерухомості</h3>
              <p className="text-sm text-muted-foreground">
                Завантажте файл з даними про нерухомість для звірки
              </p>
            </div>
            <div className="p-6 space-y-6">
              {!file ? (
                <div 
                  className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
                    isDragging ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className={`mb-4 h-12 w-12 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="mb-2 text-sm font-medium">
                    Перетягніть файл сюди або натисніть для вибору
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Підтримувані формати: CSV, XLSX
                  </p>
                  <Button type="button" className="mt-6" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                    Вибрати файл
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="bg-primary/10 p-2 rounded-md shrink-0">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="shrink-0" title="Видалити файл">
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
              
              <div className="space-y-2">
                <label htmlFor="taxRate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Базова ставка податку (грн/м²)
                </label>
                <input
                  id="taxRate"
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Наприклад: 100"
                />
                <p className="text-xs text-muted-foreground">
                  Використовується для розрахунку потенційного недоотриманого податку (штрафу)
                </p>
              </div>

              {importMutation.isError && (
                <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{importMutation.error instanceof Error ? importMutation.error.message : "Помилка завантаження файлу"}</p>
                </div>
              )}

              {importMutation.isSuccess && (
                <div className="flex items-center gap-3 rounded-xl border border-green-600/30 bg-green-600/10 p-4 text-green-700 text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <p>Файл успішно завантажено та передано на обробку! Аналіз розпочато.</p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto" 
                  disabled={!file || importMutation.isPending}
                  onClick={() => importMutation.mutate()}
                >
                  {importMutation.isPending ? "Завантаження..." : "Завантажити та розпочати аналіз"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b p-6">
            <h3 className="text-lg font-semibold">Історія завантажень</h3>
            <p className="text-sm text-muted-foreground">
              Останні імпортовані файли та результати звірки
            </p>
          </div>
          <div className="divide-y">
            {batchesLoading ? (
              <div className="p-6 text-sm text-muted-foreground">Завантаження...</div>
            ) : !batches || batches.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">Файли ще не завантажувались</div>
            ) : (
              batches.map((batch) => (
                <div key={batch.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="rounded-md bg-primary/10 p-2 shrink-0">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{batch.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {batch.rowsCount} записів · {batch.anomalyCount ?? 0} аномалій
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {new Date(batch.createdAt).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' })}
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
