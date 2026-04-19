import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  FileSearch,
  MapPin,
  TrendingUp,
  Users,
  CheckCircle,
  Lock,
} from "lucide-react"

export function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src="/name.svg" alt="AKR" className="h-10" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/legal")}>
              Правова база
            </Button>
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Увійти
            </Button>
            <Button onClick={() => navigate("/register")}>Реєстрація</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Автоматизація виявлення
            <br />
            податкових розбіжностей
          </h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl md:text-2xl">
            Система для громад України, яка автоматично знаходить
            невідповідності між земельним кадастром та реєстром нерухомості
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="text-lg"
              onClick={() => navigate("/register")}
            >
              Почати безкоштовно
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg"
              onClick={() => navigate("/login")}
            >
              Демо-доступ
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto max-w-7xl px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Ключові можливості
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<FileSearch className="h-10 w-10" />}
              title="Каскадне зіставлення"
              description="Інтелектуальний алгоритм порівняння даних за кадастровим номером, адресою та власником"
            />
            <FeatureCard
              icon={<MapPin className="h-10 w-10" />}
              title="Мобільні інспекції"
              description="PWA-додаток для інспекторів з картами та геолокацією для перевірки об'єктів на місці"
            />
            <FeatureCard
              icon={<TrendingUp className="h-10 w-10" />}
              title="Аналітика в реальному часі"
              description="Дашборд з візуалізацією виявлених розбіжностей та статистикою по громаді"
            />
            <FeatureCard
              icon={<Users className="h-10 w-10" />}
              title="Розподіл завдань"
              description="Автоматичне призначення інспекційних завдань польовим працівникам"
            />
            <FeatureCard
              icon={<CheckCircle className="h-10 w-10" />}
              title="Верифікація порушень"
              description="Підтвердження або відхилення виявлених невідповідностей з фотофіксацією"
            />
            <FeatureCard
              icon={<Lock className="h-10 w-10" />}
              title="Безпека даних"
              description="Захищене зберігання та обробка конфіденційних кадастрових даних"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto max-w-7xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold">Тарифний план</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Єдиний план з усіма можливостями для вашої громади
          </p>
          <div className="mt-12">
            <div className="rounded-2xl border border-primary bg-primary/5 p-8 shadow-lg md:p-10">
              <h3 className="text-3xl font-bold">Професійний</h3>
              <div className="mt-6">
                <span className="text-5xl font-bold">5 000</span>
                <span className="text-xl text-muted-foreground"> ₴/місяць</span>
              </div>
              <ul className="mt-8 space-y-4 text-left">
                {[
                  "Необмежена кількість записів",
                  "Повна аналітика та звіти",
                  "Мобільні інспектори з геолокацією",
                  "Пріоритетна підтримка 24/7",
                  "API доступ для інтеграцій",
                  "Експорт даних у всіх форматах",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 shrink-0 text-primary" />
                    <span className="text-base">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                className="mt-10 w-full text-lg"
                onClick={() =>
                  navigate("/checkout", {
                    state: {
                      price: 5000,
                      planName: "Професійний",
                      planTier: "professional",
                      cycle: "Щомісяця",
                    },
                  })
                }
              >
                Почати безкоштовний тріал
              </Button>
              <p className="mt-4 text-sm text-muted-foreground">
                14 днів безкоштовно, без прив'язки картки
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto max-w-7xl px-4 py-16">
        <div className="mx-auto max-w-4xl rounded-2xl border bg-card p-8 text-center shadow-lg md:p-12">
          <h2 className="text-3xl font-bold">Готові почати?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Приєднуйтесь до громад, які вже використовують AKR для
            підвищення ефективності податкового контролю
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={() => navigate("/register")}>
              Створити акаунт
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/login")}
            >
              Увійти в систему
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <p>
            © 2026 AKR. Система виявлення податкових розбіжностей для
            громад України.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
