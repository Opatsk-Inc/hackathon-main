import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard } from "lucide-react";

interface CreditCardFormProps {
  planTier: string;
  onSuccess: () => void;
}

const getCardType = (number: string): string => {
  const cleaned = number.replace(/\s+/g, "");

  if (/^4/.test(cleaned)) return "VISA";
  if (/^5[1-5]/.test(cleaned)) return "Mastercard";
  if (/^3[47]/.test(cleaned)) return "American Express";
  if (/^6(?:011|5)/.test(cleaned)) return "Discover";
  if (/^(?:2131|1800|35)/.test(cleaned)) return "JCB";

  return "CARD";
};

const getCardColor = (type: string): string => {
  switch (type) {
    case "VISA":
      return "from-blue-600 via-blue-700 to-indigo-800";
    case "Mastercard":
      return "from-red-600 via-orange-600 to-yellow-700";
    case "American Express":
      return "from-teal-600 via-cyan-700 to-blue-800";
    case "Discover":
      return "from-orange-600 via-orange-700 to-red-800";
    case "JCB":
      return "from-green-600 via-emerald-700 to-teal-800";
    default:
      return "from-purple-600 via-purple-700 to-indigo-800";
  }
};

export function CreditCardForm({ planTier, onSuccess }: CreditCardFormProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const cardType = getCardType(cardNumber);
  const cardColor = getCardColor(cardType);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;

    requestAnimationFrame(() => {
      if (cardRef.current) {
        cardRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${isFlipped ? 180 + rotateY : rotateY}deg)`;
      }
    });
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = `rotateX(0deg) rotateY(${isFlipped ? 180 : 0}deg)`;
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsProcessing(false);
    onSuccess();
  };

  return (
    <div className="space-y-8">
      {/* 3D Card Preview */}
      <div
        className="perspective-1000"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          ref={cardRef}
          className="relative h-56 w-full transform-style-3d"
          style={{
            transform: `rotateX(0deg) rotateY(${isFlipped ? 180 : 0}deg)`,
            transition: 'transform 0.15s ease-out'
          }}
        >
          {/* Front of card */}
          <div className={`backface-hidden absolute inset-0 rounded-2xl bg-gradient-to-br ${cardColor} p-6 text-white shadow-2xl`}>
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <CreditCard className="h-10 w-10 opacity-80" />
                <div className="text-sm font-bold opacity-90">{cardType}</div>
              </div>

              <div className="space-y-4">
                <div className="font-mono text-2xl tracking-wider">
                  {cardNumber || "•••• •••• •••• ••••"}
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase opacity-70">Власник картки</div>
                    <div className="font-mono text-sm">
                      {cardName || "YOUR NAME"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase opacity-70">Термін дії</div>
                    <div className="font-mono text-sm">
                      {expiry || "MM/YY"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back of card */}
          <div className="backface-hidden rotate-y-180 absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 text-white shadow-2xl">
            <div className="mt-8 h-12 w-full bg-black"></div>
            <div className="p-6">
              <div className="flex items-center justify-end">
                <div className="rounded bg-white px-3 py-1 text-right font-mono text-lg text-black">
                  {cvv || "•••"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cardNumber">Номер картки</Label>
          <Input
            id="cardNumber"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            maxLength={19}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cardName">Ім'я власника</Label>
          <Input
            id="cardName"
            placeholder="TARAS SHEVCHENKO"
            value={cardName}
            onChange={(e) => setCardName(e.target.value.toUpperCase())}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiry">Термін дії</Label>
            <Input
              id="expiry"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              maxLength={5}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cvv">CVV</Label>
            <Input
              id="cvv"
              placeholder="123"
              type="text"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/gi, ""))}
              onFocus={() => setIsFlipped(true)}
              onBlur={() => setIsFlipped(false)}
              maxLength={3}
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
          {isProcessing ? "Обробка..." : "Оплатити"}
        </Button>
      </form>
    </div>
  );
}
