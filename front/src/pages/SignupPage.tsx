import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, UserPlus, Shield, AlertCircle, Search, ChevronDown, Check } from 'lucide-react'
import { useSignup, useHromadas } from '@/features/auth'
import type { Hromada } from '@/lib/api/auth.service'

export function SignupPage() {
  const [hromada, setHromada] = useState<Hromada | null>(null)
  const [search, setSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)

  const signup = useSignup()
  const { data: hromadas = [], isLoading: hromadasLoading } = useHromadas()

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return hromadas
    return hromadas.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.region.toLowerCase().includes(q) ||
        h.district.toLowerCase().includes(q)
    )
  }, [hromadas, search])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (h: Hromada) => {
    setHromada(h)
    setSearch(h.name)
    setDropdownOpen(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!hromada) {
      setLocalError('Оберіть громаду зі списку')
      return
    }
    if (password !== confirmPassword) {
      setLocalError('Паролі не збігаються')
      return
    }
    if (password.length < 8) {
      setLocalError('Пароль повинен містити мінімум 8 символів')
      return
    }
    if (hromada.email) {
      setLocalError('Ця громада вже має зареєстрований акаунт')
      return
    }

    signup.mutate({ hromadaId: hromada.id, email, password })
  }

  const serverError = signup.error
    ? (signup.error as Error).message.includes('409')
      ? 'Ця громада або email вже зареєстровані'
      : (signup.error as Error).message.includes('404')
        ? 'Громаду не знайдено в системі'
        : 'Помилка підключення до сервера'
    : null

  const displayError = localError || serverError

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2">
        <div className="pointer-events-none absolute -left-16 top-24 h-[26rem] w-[26rem] rounded-full bg-sky-400/25 blur-[110px]" />
        <div className="pointer-events-none absolute bottom-8 right-10 h-[28rem] w-[28rem] rounded-full bg-amber-400/25 blur-[110px]" />

        <div className="relative z-10 flex flex-col justify-center px-16 text-slate-900">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600 shadow-[0_18px_40px_rgba(217,119,6,0.38)]">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="font-heading text-2xl font-semibold tracking-[-0.02em]">
              Gromada Audit
            </span>
          </div>

          <h2 className="mb-4 font-heading text-4xl font-semibold leading-tight tracking-[-0.03em]">
            Приєднайтесь<br />
            до системи<br />
            контролю
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-slate-600">
            Зареєструйте свою громаду та отримайте доступ до повного інструментарію аудиту
          </p>

          <div className="mt-12 space-y-5">
            {[
              { step: '01', title: 'Оберіть громаду', desc: 'Знайдіть вашу громаду в реєстрі' },
              { step: '02', title: 'Введіть дані', desc: 'Email та надійний пароль' },
              { step: '03', title: 'Починайте аудит', desc: 'Завантажуйте реєстри та виявляйте розбіжності' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <span className="mt-1 font-heading text-3xl font-semibold leading-none text-amber-600/60">
                  {item.step}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-12">
        <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/80 p-8 shadow-[0_30px_80px_rgba(11,28,54,0.18)] backdrop-blur-3xl md:p-10">
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="font-heading text-xl font-semibold text-slate-900">Gromada Audit</span>
          </div>

          <div className="mb-8">
            <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-slate-900">
              Реєстрація
            </h1>
            <p className="mt-2 text-sm text-slate-500">Створіть акаунт для вашої громади</p>
          </div>

          {displayError && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/80 p-4 text-sm text-rose-700 backdrop-blur-xl">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2" ref={dropdownRef}>
              <label className="text-sm font-medium text-slate-800">
                Громада <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div
                  className={`flex cursor-text items-center gap-2 rounded-xl border bg-white/70 px-4 py-3 backdrop-blur-xl transition-all ${
                    dropdownOpen
                      ? 'border-amber-300 ring-4 ring-amber-500/20'
                      : 'border-white/70'
                  }`}
                  onClick={() => setDropdownOpen(true)}
                >
                  <Search className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    id="signup-hromada"
                    type="text"
                    placeholder={hromadasLoading ? 'Завантаження...' : 'Пошук громади...'}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setHromada(null)
                      setDropdownOpen(true)
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                    autoComplete="off"
                  />
                  {hromada && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
                  {!hromada && <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />}
                </div>

                {dropdownOpen && (
                  <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_24px_60px_rgba(11,28,54,0.18)] backdrop-blur-3xl">
                    <div className="max-h-60 overflow-y-auto">
                      {filtered.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-slate-500">
                          Громаду не знайдено
                        </div>
                      ) : (
                        filtered.slice(0, 50).map((h) => (
                          <button
                            key={h.id}
                            type="button"
                            disabled={!!h.email}
                            onClick={() => !h.email && handleSelect(h)}
                            className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors ${
                              hromada?.id === h.id ? 'bg-amber-50/80' : ''
                            } ${h.email ? 'cursor-not-allowed opacity-60' : 'hover:bg-amber-50/60'}`}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-900">{h.name}</p>
                              <p className="truncate text-xs text-slate-500">
                                {h.region} · {h.district}
                              </p>
                            </div>
                            {h.email && (
                              <span className="shrink-0 rounded-full bg-rose-50/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 ring-1 ring-rose-200/80">
                                зайнята
                              </span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {hromada && (
                <p className="text-xs text-slate-500">
                  {hromada.region} · {hromada.district} · KOATUU: {hromada.koatuu}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="signup-email" className="text-sm font-medium text-slate-800">
                Email <span className="text-rose-500">*</span>
              </label>
              <input
                id="signup-email"
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
              <label htmlFor="signup-password" className="text-sm font-medium text-slate-800">
                Пароль <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
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
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="signup-confirm-password" className="text-sm font-medium text-slate-800">
                Підтвердження пароля <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторіть пароль"
                  className={`w-full rounded-xl border bg-white/70 px-4 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none backdrop-blur-xl transition-all focus:ring-4 ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/20'
                      : 'border-white/70 focus:border-amber-300 focus:ring-amber-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-rose-600">Паролі не збігаються</p>
              )}
            </div>

            <button
              id="signup-submit"
              type="submit"
              disabled={signup.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(217,119,6,0.3)] transition-all hover:bg-amber-500 hover:shadow-[0_16px_38px_rgba(217,119,6,0.36)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {signup.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Реєстрація...
                </span>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Зареєструватись
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Вже маєте акаунт?{' '}
            <Link
              to="/login"
              className="font-semibold text-sky-600 underline-offset-4 transition-colors hover:text-sky-700 hover:underline"
            >
              Увійти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
