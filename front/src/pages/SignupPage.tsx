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

  // Close dropdown on outside click
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
    <div className="min-h-screen bg-background flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[var(--brand-slate)]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-32 right-10 w-80 h-80 rounded-full bg-[var(--brand-brown)] blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-[var(--brand-dark)] blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-[var(--brand-cream)]">
          <div className="mb-8 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--brand-brown)] flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Gromada Audit</span>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-4">
            Приєднайтесь<br />
            до системи<br />
            контролю
          </h2>
          <p className="text-[var(--brand-cream)]/60 text-lg leading-relaxed">
            Зареєструйте свою громаду та отримайте доступ до повного інструментарію аудиту
          </p>

          <div className="mt-12 space-y-4">
            {[
              { step: '01', title: 'Оберіть громаду', desc: 'Знайдіть вашу громаду в реєстрі' },
              { step: '02', title: 'Введіть дані', desc: 'Email та надійний пароль' },
              { step: '03', title: 'Починайте аудит', desc: 'Завантажуйте реєстри та виявляйте розбіжності' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <span className="text-3xl font-bold text-[var(--brand-brown)]/40 leading-none mt-1">
                  {item.step}
                </span>
                <div>
                  <p className="font-semibold text-sm text-[var(--brand-cream)]">{item.title}</p>
                  <p className="text-xs text-[var(--brand-cream)]/50 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <div className="w-9 h-9 rounded-lg bg-[var(--brand-dark)] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[var(--brand-cream)]" />
            </div>
            <span className="text-xl font-bold text-foreground">Gromada Audit</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Реєстрація</h1>
            <p className="text-muted-foreground mt-2">Створіть акаунт для вашої громади</p>
          </div>

          {displayError && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Hromada selector */}
            <div className="space-y-2" ref={dropdownRef}>
              <label className="text-sm font-medium text-foreground">
                Громада <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <div
                  className={`flex items-center gap-2 rounded-xl border bg-card px-4 py-3 cursor-text transition-all ${
                    dropdownOpen
                      ? 'border-[var(--brand-slate)] ring-2 ring-[var(--brand-slate)]/20'
                      : 'border-border'
                  }`}
                  onClick={() => setDropdownOpen(true)}
                >
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
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
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    autoComplete="off"
                  />
                  {hromada && <Check className="w-4 h-4 text-green-600 shrink-0" />}
                  {!hromada && <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </div>

                {dropdownOpen && (
                  <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      {filtered.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                          Громаду не знайдено
                        </div>
                      ) : (
                        filtered.slice(0, 50).map((h) => (
                          <button
                            key={h.id}
                            type="button"
                            disabled={!!h.email}
                            onClick={() => !h.email && handleSelect(h)}
                            className={`w-full text-left px-4 py-3 transition-colors flex items-center justify-between gap-2 ${
                              hromada?.id === h.id ? 'bg-muted' : ''
                            } ${h.email ? 'opacity-60 cursor-not-allowed' : 'hover:bg-muted'}`}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{h.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {h.region} · {h.district}
                              </p>
                            </div>
                            {h.email && (
                              <div className="flex flex-col items-end gap-1">
                                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider bg-destructive/10 text-destructive rounded-md px-2 py-0.5 border border-destructive/20">
                                  зайнята
                                </span>
                              </div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {hromada && (
                <p className="text-xs text-muted-foreground">
                  {hromada.region} · {hromada.district} · KOATUU: {hromada.koatuu}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="signup-email" className="text-sm font-medium text-foreground">
                Email <span className="text-destructive">*</span>
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hromada@example.com"
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-[var(--brand-slate)] focus:ring-2 focus:ring-[var(--brand-slate)]/20"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="signup-password" className="text-sm font-medium text-foreground">
                Пароль <span className="text-destructive">*</span>
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
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-[var(--brand-slate)] focus:ring-2 focus:ring-[var(--brand-slate)]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <label htmlFor="signup-confirm-password" className="text-sm font-medium text-foreground">
                Підтвердження пароля <span className="text-destructive">*</span>
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
                  className={`w-full rounded-xl border bg-card px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                      : 'border-border focus:border-[var(--brand-slate)] focus:ring-[var(--brand-slate)]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-destructive">Паролі не збігаються</p>
              )}
            </div>

            <button
              id="signup-submit"
              type="submit"
              disabled={signup.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-dark)] px-4 py-3 text-sm font-semibold text-[var(--brand-cream)] transition-all hover:bg-[var(--brand-slate)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {signup.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Реєстрація...
                </span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Зареєструватись
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Вже маєте акаунт?{' '}
            <Link
              to="/login"
              className="font-semibold text-[var(--brand-slate)] hover:text-[var(--brand-dark)] transition-colors underline underline-offset-4"
            >
              Увійти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
