import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InspectorProfile } from '@/lib/api/auth.service'

interface InspectorAuthState {
  token: string | null
  inspector: InspectorProfile | null
  setSession: (token: string, inspector: InspectorProfile) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useInspectorStore = create<InspectorAuthState>()(
  persist(
    (set, get) => ({
      token: null,
      inspector: null,

      setSession: (token, inspector) => {
        localStorage.setItem('inspector_token', token)
        set({ token, inspector })
      },

      logout: () => {
        localStorage.removeItem('inspector_token')
        set({ token: null, inspector: null })
      },

      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'inspector-auth',
      partialize: (state) => ({ token: state.token, inspector: state.inspector }),
    }
  )
)
