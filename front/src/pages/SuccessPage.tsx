import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export function SuccessPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center space-y-6 p-4">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-500">
        <CheckCircle className="h-12 w-12 text-white" />
      </div>
      <h2 className="text-center text-3xl font-bold">Оплата успішна!</h2>
      <p className="max-w-md text-center text-lg text-muted-foreground">
        Дякуємо за підписку. Ваша транзакція успішно завершена. Тепер ви можете користуватися всіма можливостями системи.
      </p>
      <Button size="lg" asChild>
        <Link to="/login">Перейти до входу</Link>
      </Button>
    </div>
  );
}
