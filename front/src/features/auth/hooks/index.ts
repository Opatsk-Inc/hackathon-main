import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AuthService } from '@/lib/api/auth.service'
import { useAuthStore } from '../store/auth.store'
import { HROMADAS } from '@/lib/constants/hromadas'
import type { Hromada } from '@/lib/api/auth.service'

export function useHromadas(): { data: Hromada[]; isLoading: boolean } {
  return { data: HROMADAS, isLoading: false }
}

export function useLogin() {
  const { setToken, setUser } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: AuthService.login,
    onSuccess: async (data) => {
      setToken(data.token)
      try {
        const me = await AuthService.getMe()
        setUser(me)
      } catch {
        // ignore, token is still set
      }
      navigate('/head/dashboard')
    },
  })
}

export function useSignup() {
  const { setToken, setUser } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: AuthService.signup,
    onSuccess: async (data) => {
      setToken(data.token)
      try {
        const me = await AuthService.getMe()
        setUser(me)
      } catch {
        // ignore
      }
      navigate('/head/dashboard')
    },
  })
}




export function useLogout() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  return () => {
    logout()
    navigate('/login')
  }
}
