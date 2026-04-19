import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { ApiClient } from "@/lib/api/client";

interface AiRecommendationProps {
  anomalyId: string;
}

export function AiRecommendation({ anomalyId }: AiRecommendationProps) {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchRecommendation = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await ApiClient.get<{ anomalyId: string; content: string }>(
        `/api/recommendations/${anomalyId}`
      );
      setRecommendation(data.content);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (!recommendation && !loading && !error) {
    return (
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            AI Рекомендації
          </h3>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={fetchRecommendation}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Згенерувати рекомендації
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 p-4">
        <p className="text-sm text-red-700 dark:text-red-400">
          Не вдалося згенерувати рекомендації. Спробуйте ще раз.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={fetchRecommendation}
        >
          Спробувати знову
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
        <p className="text-xs font-bold text-purple-700 dark:text-purple-400">
          AI Рекомендації інструктору
        </p>
      </div>
      <div className="text-sm text-purple-900 dark:text-purple-200 leading-relaxed whitespace-pre-wrap">
        {recommendation}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs"
        onClick={fetchRecommendation}
      >
        Оновити рекомендації
      </Button>
    </div>
  );
}
