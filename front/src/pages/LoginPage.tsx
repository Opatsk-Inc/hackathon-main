import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
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
    <div className="auth-page-bg flex min-h-screen">
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2">
        <div className="relative z-10 flex flex-col justify-center px-16 text-slate-900">
          <div className="mb-10 flex items-center gap-3">
            <img src="/name.svg" alt="Gromada Audit" className="h-8" />
          </div>
          <h2 className="mb-5 font-heading text-5xl font-semibold leading-[1.05] tracking-[-0.03em] text-slate-900">
            Civic intelligence<br />
            для податкового<br />
            аудиту громади
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-slate-600">
            Виявляйте аномалії у реєстрах нерухомості та земельного кадастру автоматично, фокусуйтеся
            на найбільш ризикових кейсах і скорочуйте час перевірок.
          </p>

          <div className="mt-12 grid max-w-2xl grid-cols-2 gap-4">
            {[
              { label: 'Автоматичний аналіз', desc: 'CSV та XLSX файли' },
              { label: 'AI-поради інспекторам', desc: 'Рекомендації в полі' },
              { label: 'Звіти в реальному часі', desc: 'Дашборд метрик' },
              { label: 'Мобільні інспектори', desc: 'Виїзні перевірки' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/70 bg-white/60 p-4 shadow-[0_1px_2px_rgba(11,28,54,0.04),0_10px_24px_rgba(11,28,54,0.06)] backdrop-blur-xl"
              >
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/80 p-8 shadow-[0_30px_80px_rgba(11,28,54,0.18)] backdrop-blur-3xl md:p-10">
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600">
              <img src="/logo.svg" className="h-5 w-5" alt="Logo" />
            </div>
            <img src="/name.svg" alt="Gromada Audit" className="h-6" />
          </div>

          <div className="mb-8">
            <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-slate-900">
              Увійти
            </h1>
            <p className="mt-2 text-sm text-slate-500">Введіть облікові дані вашої громади</p>
          </div>

          {errorMessage && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/80 p-4 text-sm text-rose-700 backdrop-blur-xl">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="login-email" className="text-sm font-medium text-slate-800">
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
                className="w-full rounded-xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none backdrop-blur-xl transition-all focus:border-amber-300 focus:ring-4 focus:ring-amber-500/20"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="login-password" className="text-sm font-medium text-slate-800">
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
                  className="w-full rounded-xl border border-white/70 bg-white/70 px-4 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none backdrop-blur-xl transition-all focus:border-amber-300 focus:ring-4 focus:ring-amber-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                  aria-label={showPassword ? 'Приховати пароль' : 'Показати пароль'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={login.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(217,119,6,0.3)] transition-all hover:bg-amber-500 hover:shadow-[0_16px_38px_rgba(217,119,6,0.36)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {login.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Вхід...
                </span>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Увійти
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Немає акаунту?{' '}
            <Link
              to="/signup"
              className="font-semibold text-sky-600 underline-offset-4 transition-colors hover:text-sky-700 hover:underline"
            >
              Зареєструватись
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
