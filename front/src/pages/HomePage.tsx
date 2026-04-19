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
import { PageTransition } from "@/components/PageTransition"
import { motion, useInView, useMotionValue, useSpring } from "framer-motion"
import { useEffect, useRef } from "react"

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { duration: 2000 })
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  useEffect(() => {
    if (isInView) {
      motionValue.set(value)
    }
  }, [isInView, motionValue, value])

  useEffect(() => {
    springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Math.floor(latest).toLocaleString() + suffix
      }
    })
  }, [springValue, suffix])

  return <div ref={ref} className="mb-2 text-5xl font-bold text-primary">0{suffix}</div>
}

export function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div
            className="flex cursor-pointer items-center gap-2"
            onClick={() => navigate("/")}
          >
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

      <PageTransition>

        {/* Hero Section */}
        <section className="container mx-auto max-w-7xl px-4 py-12 md:py-16">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              {["Автоматизація", "виявлення"].map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-block mr-3"
                >
                  {word}
                </motion.span>
              ))}
              <br />
              {["податкових", "розбіжностей"].map((word, i) => (
                <motion.span
                  key={i + 2}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: (i + 2) * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-block mr-3"
                >
                  {word}
                </motion.span>
              ))}
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 text-lg text-muted-foreground sm:text-xl md:text-2xl"
            >
              Система для громад України, яка автоматично знаходить
              невідповідності між земельним кадастром та реєстром нерухомості
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center"
            >
              <Button
                size="lg"
                className="text-lg"
                onClick={() => {
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }}
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
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto max-w-7xl px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 md:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0 }}
                className="rounded-2xl border bg-card p-8 text-center shadow-lg"
              >
                <AnimatedCounter value={99} suffix="%" />
                <p className="text-lg font-semibold">Точність виявлення</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Алгоритм знаходить невідповідності з високою точністю
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-2xl border bg-card p-8 text-center shadow-lg"
              >
                <AnimatedCounter value={125} suffix="%" />
                <p className="text-lg font-semibold">Зростання бюджету ОТГ</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Середнє збільшення надходжень до місцевого бюджету
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="rounded-2xl border bg-card p-8 text-center shadow-lg"
              >
                <AnimatedCounter value={20} suffix="x" />
                <p className="text-lg font-semibold">Швидше перевірки</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Автоматизація скорочує час аудиту в 10 разів
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto max-w-7xl px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="mb-12 text-center text-3xl font-bold"
            >
              Ключові можливості
            </motion.h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: <FileSearch className="h-10 w-10" />,
                  title: "Каскадне зіставлення",
                  description: "Інтелектуальний алгоритм порівняння даних за кадастровим номером, адресою та власником"
                },
                {
                  icon: <MapPin className="h-10 w-10" />,
                  title: "Мобільні інспекції",
                  description: "PWA-додаток для інспекторів з картами та геолокацією для перевірки об'єктів на місці"
                },
                {
                  icon: <TrendingUp className="h-10 w-10" />,
                  title: "Аналітика в реальному часі",
                  description: "Дашборд з візуалізацією виявлених розбіжностей та статистикою по громаді"
                },
                {
                  icon: <Users className="h-10 w-10" />,
                  title: "Розподіл завдань",
                  description: "Автоматичне призначення інспекційних завдань польовим працівникам"
                },
                {
                  icon: <CheckCircle className="h-10 w-10" />,
                  title: "Верифікація порушень",
                  description: "Підтвердження або відхилення виявлених невідповідностей з фотофіксацією"
                },
                {
                  icon: <Lock className="h-10 w-10" />,
                  title: "Безпека даних",
                  description: "Захищене зберігання та обробка конфіденційних кадастрових даних"
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <FeatureCard
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="container mx-auto max-w-7xl px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold"
            >
              Тарифний план
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-3 text-lg text-muted-foreground"
            >
              Єдиний план з усіма можливостями для вашої громади
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-12"
            >
              <div className="rounded-2xl border border-primary bg-primary/5 p-8 shadow-lg md:p-10">
                <h3 className="text-3xl font-bold">Професійний</h3>
                <div className="mt-6">
                  <span className="text-2xl text-muted-foreground line-through mr-3">5 000 ₴</span>
                  <span className="text-5xl font-bold">0</span>
                  <span className="text-xl text-muted-foreground">
                    {" "}
                    ₴/місяць
                  </span>
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
                  14 днів безкоштовно
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto max-w-7xl px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl rounded-2xl border bg-card p-8 text-center shadow-lg md:p-12"
          >
            <h2 className="text-3xl font-bold">Готові почати?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Приєднуйтесь до громад, які вже використовують AKR для підвищення
              ефективності податкового контролю
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
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t py-8">
          <div className="container mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
            <p>
              © 2026 AKR. Система виявлення податкових розбіжностей для громад
              України.
            </p>
          </div>
        </footer>
      </PageTransition>
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
