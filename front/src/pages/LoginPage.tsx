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
    ? (login.error as Error).message.includes('401')
      ? 'Невірний email або пароль'
      : 'Помилка підключення до сервера'
    : null

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[var(--brand-dark)]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-[var(--brand-brown)] blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-[var(--brand-slate)] blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-[var(--brand-cream)]">
          <div className="mb-8 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--brand-brown)] flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Gromada Audit</span>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Система аналізу<br />
            податкових<br />
            розбіжностей
          </h2>
          <p className="text-[var(--brand-cream)]/60 text-lg leading-relaxed">
            Виявляйте аномалії у реєстрах нерухомості та земельного кадастру автоматично
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4">
            {[
              { label: 'Автоматичний аналіз', desc: 'CSV та XLSX файли' },
              { label: 'Геокодування', desc: 'Координати об\'єктів' },
              { label: 'Звіти в реальному часі', desc: 'Дашборд метрик' },
              { label: 'Мобільні інспектори', desc: 'Виїзні перевірки' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-[var(--brand-cream)]/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <p className="font-semibold text-sm text-[var(--brand-cream)]">{item.label}</p>
                <p className="text-xs text-[var(--brand-cream)]/50 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <div className="w-9 h-9 rounded-lg bg-[var(--brand-dark)] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[var(--brand-cream)]" />
            </div>
            <span className="text-xl font-bold text-foreground">Gromada Audit</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Увійти</h1>
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
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-[var(--brand-slate)] focus:ring-2 focus:ring-[var(--brand-slate)]/20"
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
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-[var(--brand-slate)] focus:ring-2 focus:ring-[var(--brand-slate)]/20"
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
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-dark)] px-4 py-3 text-sm font-semibold text-[var(--brand-cream)] transition-all hover:bg-[var(--brand-slate)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
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
              className="font-semibold text-[var(--brand-slate)] hover:text-[var(--brand-dark)] transition-colors underline underline-offset-4"
            >
              Зареєструватись
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
