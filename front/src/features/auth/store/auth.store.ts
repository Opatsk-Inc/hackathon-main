import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HromadaProfile } from '@/lib/api/auth.service'

interface AuthState {
  token: string | null
  user: HromadaProfile | null
  setToken: (token: string) => void
  setUser: (user: HromadaProfile) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      setToken: (token) => {
        localStorage.setItem('auth_token', token)
        set({ token })
      },

      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem('auth_token')
        set({ token: null, user: null })
      },

      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)
