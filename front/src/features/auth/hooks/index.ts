import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AuthService } from '@/lib/api/auth.service'
import { useAuthStore } from '../store/auth.store'

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

export function useHromadas(enabled = true) {
  return useQuery({
    queryKey: ['hromadas'],
    queryFn: AuthService.getHromadas,
    enabled,
    staleTime: 5 * 60 * 1000,
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
