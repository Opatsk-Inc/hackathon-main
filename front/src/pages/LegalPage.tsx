import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Scale, FileText, AlertCircle, Menu, X } from "lucide-react"
import { PageTransition } from "@/components/PageTransition"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function LegalPage() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src="/name.svg" alt="AKR" className="h-8 sm:h-10" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" onClick={() => navigate("/")}>
              Головна
            </Button>
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Увійти
            </Button>
            <Button onClick={() => navigate("/register")}>Реєстрація</Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="border-t bg-background/95 backdrop-blur md:hidden overflow-hidden"
            >
              <div className="container mx-auto max-w-7xl px-4 py-4 flex flex-col gap-2">
                {[
                  { label: "Головна", path: "/" },
                  { label: "Увійти", path: "/login", variant: "ghost" as const },
                  { label: "Реєстрація", path: "/register", variant: "default" as const }
                ].map((item, i) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Button
                      variant={item.variant || "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        navigate(item.path)
                        setMobileMenuOpen(false)
                      }}
                    >
                      {item.label}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <PageTransition>

      {/* Content */}
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <h1 className="mb-8 text-center text-4xl font-bold">
          Відповідність нормативно-правовій базі
          <br />
          та межі повноважень
        </h1>

        <div className="space-y-8">
          {/* Правова база */}
          <section className="rounded-2xl border bg-card p-8 shadow-lg">
            <div className="mb-4 flex items-center gap-3">
              <Scale className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-bold">Правова база</h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Система AKR функціонує на підставі наступних
                нормативно-правових актів України:
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>Податковий кодекс України</strong> (ст. 69, 73) —
                    повноваження контролюючих органів щодо перевірки
                    достовірності даних про об'єкти оподаткування
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>Закон України "Про місцеве самоврядування"</strong>{" "}
                    (ст. 26, 43) — повноваження органів місцевого
                    самоврядування у сфері бюджету та фінансів
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>Земельний кодекс України</strong> (ст. 203-206) —
                    державний контроль за використанням та охороною земель
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>
                      Закон України "Про Державний земельний кадастр"
                    </strong>{" "}
                    — порядок ведення та використання кадастрових даних
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>
                      Закон України "Про державну реєстрацію речових прав на
                      нерухоме майно"
                    </strong>{" "}
                    — доступ до відомостей реєстру
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Повноваження */}
          <section className="rounded-2xl border bg-card p-8 shadow-lg">
            <div className="mb-4 flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-bold">Повноваження посадових осіб</h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Уповноважені працівники органів місцевого самоврядування мають
                право:
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">✓</span>
                  <span>
                    Здійснювати зіставлення даних Державного земельного
                    кадастру та Державного реєстру речових прав на нерухоме
                    майно
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">✓</span>
                  <span>
                    Виявляти невідповідності між задекларованими та фактичними
                    об'єктами оподаткування
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">✓</span>
                  <span>
                    Проводити виїзні перевірки об'єктів нерухомості за наявності
                    обґрунтованих підстав (виявлених розбіжностей у даних)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">✓</span>
                  <span>
                    Фіксувати фактичний стан об'єктів (фото, відеозйомка,
                    геолокація) під час інспекцій
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">✓</span>
                  <span>
                    Направляти матеріали перевірок до контролюючих органів для
                    прийняття рішень
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Обмеження */}
          <section className="rounded-2xl border border-destructive/20 bg-card p-8 shadow-lg">
            <div className="mb-4 flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <h2 className="text-2xl font-bold">Межі повноважень та обмеження</h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p className="font-semibold text-destructive">
                Система НЕ надає права:
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-destructive">✗</span>
                  <span>
                    Самостійно приймати рішення про нарахування податків,
                    штрафів чи пені — це виключна компетенція контролюючих
                    органів (ДПС)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-destructive">✗</span>
                  <span>
                    Проводити примусовий вхід до приватних володінь без
                    відповідного судового рішення
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-destructive">✗</span>
                  <span>
                    Вимагати від власників документи, не передбачені чинним
                    законодавством
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-destructive">✗</span>
                  <span>
                    Розголошувати персональні дані платників податків третім
                    особам (крім випадків, передбачених законом)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-destructive">✗</span>
                  <span>
                    Застосовувати будь-які санкції до платників — система є
                    виключно інструментом виявлення та документування
                    розбіжностей
                  </span>
                </li>
              </ul>
              <div className="mt-6 rounded-lg bg-destructive/10 p-4">
                <p className="text-sm font-semibold text-destructive">
                  Важливо: AKR є аналітичним інструментом для
                  виявлення потенційних розбіжностей. Остаточні рішення щодо
                  правомірності оподаткування приймаються виключно
                  контролюючими органами у встановленому законом порядку з
                  дотриманням права платника на оскарження.
                </p>
              </div>
            </div>
          </section>

          {/* Контакти */}
          <section className="rounded-2xl border bg-primary/5 p-8 text-center">
            <h3 className="mb-4 text-xl font-bold">Питання та скарги</h3>
            <p className="mb-6 text-muted-foreground">
              У разі виникнення питань щодо правомірності дій посадових осіб або
              порушення ваших прав, ви можете звернутися:
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                • До керівництва відповідного органу місцевого самоврядування
              </p>
              <p>• До Державної податкової служби України</p>
              <p>• До Уповноваженого Верховної Ради з прав людини</p>
              <p>• До суду в порядку адміністративного судочинства</p>
            </div>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Button size="lg" onClick={() => navigate("/")}>
            Повернутися на головну
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <p>
            © 2026 AKR. Система виявлення податкових розбіжностей для
            громад України.
          </p>
        </div>
      </footer>
      </PageTransition>
    </div>
  )
}
