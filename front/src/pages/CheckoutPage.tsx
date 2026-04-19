import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { CreditCardForm } from "@/features/subscription/components/credit-card-form";

export function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { price, planName, planTier, cycle } = location.state || {};

  useEffect(() => {
    if (!planTier) {
      console.log("No plan data in state, redirecting to home");
      navigate('/');
    }
  }, [planTier, navigate]);

  const handleSuccess = () => {
    navigate('/success');
  };

  if (!planTier) {
    return null;
  }

  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center bg-muted/40 p-8 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Оформлення підписки</h1>
            <p className="mt-2 text-muted-foreground">
              Завершіть оформлення, ввівши дані вашої картки
            </p>
          </div>
          <CreditCardForm
            planTier={planTier}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
      <div className="flex flex-col items-center justify-center bg-background p-8 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <h2 className="text-2xl font-bold">Деталі замовлення</h2>
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-lg">{planName}</span>
                <span className="text-lg font-semibold">{price} ₴</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Період оплати</span>
                <span>{cycle}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-xl font-bold">
                <span>Всього</span>
                <span>{price} ₴</span>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                <p>✓ 14 днів безкоштовно</p>
                <p>✓ Скасувати можна будь-коли</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
