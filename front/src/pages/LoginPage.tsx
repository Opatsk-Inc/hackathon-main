import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Shield, AlertCircle } from 'lucide-react'
import { useLogin } from '@/features/auth'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const login = useLogin()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login.mutate({ email, password })
  }

  const errorMessage = login.error
    ? (() => {
        const msg = (login.error as Error).message
        if (msg.startsWith('401')) return 'Невірний email або пароль'
        if (msg.startsWith('404')) return 'Акаунт не знайдено'
        if (msg.startsWith('0') || msg.includes('fetch')) return 'Не вдалося підключитися до сервера'
        return 'Помилка входу. Спробуйте ще раз'
      })()
    : null

  return (
    <div className="atmo-shell min-h-screen bg-background flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1f38]/40 via-[#16325b]/25 to-transparent" />
        <div className="absolute inset-0 opacity-75">
          <div className="absolute -top-20 -left-24 w-[34rem] h-[34rem] rounded-full bg-[#f5a365]/18 blur-[120px]" />
          <div className="absolute bottom-[-5rem] right-[-4rem] w-[28rem] h-[28rem] rounded-full bg-[#79c0b5]/16 blur-[110px]" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-[var(--brand-cream)]">
          <div className="mb-8 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#f38c3d] flex items-center justify-center shadow-lg shadow-[#f38c3d]/25">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-atmo-heading">Gromada Audit</span>
          </div>
          <h2 className="text-5xl font-bold leading-[1.05] mb-4 text-atmo-heading">
            Civic intelligence<br />
            для податкового<br />
            аудиту громади
          </h2>
          <p className="text-atmo-muted text-lg leading-relaxed max-w-xl">
            Виявляйте аномалії у реєстрах нерухомості та земельного кадастру автоматично,
            фокусуйтеся на найбільш ризикових кейсах і скорочуйте час перевірок.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4 max-w-2xl">
            {[
              { label: 'Автоматичний аналіз', desc: 'CSV та XLSX файли' },
              { label: 'Геокодування', desc: 'Координати об\'єктів' },
              { label: 'Звіти в реальному часі', desc: 'Дашборд метрик' },
              { label: 'Мобільні інспектори', desc: 'Виїзні перевірки' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm"
              >
                <p className="font-semibold text-sm text-atmo-heading">{item.label}</p>
                <p className="text-xs text-atmo-muted mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="panel-strong w-full max-w-md rounded-3xl p-8 md:p-10">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <div className="w-9 h-9 rounded-lg bg-[#10213f] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#f8fbff]" />
            </div>
            <span className="text-xl font-bold text-foreground">Gromada Audit</span>
          </div>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground leading-[1.05]">Увійти</h1>
            <p className="text-muted-foreground mt-2">Введіть облікові дані вашої громади</p>
          </div>

          {errorMessage && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="login-email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hromada@example.com"
                className="w-full rounded-xl border border-white/60 bg-white/55 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-[#5f7391] focus:ring-2 focus:ring-[#5f7391]/20"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="login-password" className="text-sm font-medium text-foreground">
                Пароль
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Мінімум 8 символів"
                  className="w-full rounded-xl border border-white/60 bg-white/55 px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-[#5f7391] focus:ring-2 focus:ring-[#5f7391]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Приховати пароль' : 'Показати пароль'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={login.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#10213f] px-4 py-3 text-sm font-semibold text-[#f8fbff] transition-all hover:bg-[#1c365f] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#10213f]/30"
            >
              {login.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Вхід...
                </span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Увійти
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Немає акаунту?{' '}
            <Link
              to="/signup"
              className="font-semibold text-[#2f6fe8] hover:text-[#1f55b5] transition-colors underline underline-offset-4"
            >
              Зареєструватись
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
