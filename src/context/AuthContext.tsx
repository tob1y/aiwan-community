import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { SessionUser } from '../types'
import { apiJson, getToken, setToken } from '../lib/api'

type AuthContextValue = {
  token: string | null
  user: SessionUser | null
  authLoading: boolean
  register: (input: {
    nickname: string
    realName: string
    password: string
  }) => Promise<{ ok: true } | { ok: false; message: string }>
  login: (nickname: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken())
  const [user, setUser] = useState<SessionUser | null>(null)
  const [authLoading, setAuthLoading] = useState(!!getToken())

  useEffect(() => {
    let cancelled = false
    const t = getToken()
    if (!t) {
      setUser(null)
      setAuthLoading(false)
      return
    }
    setAuthLoading(true)
    void apiJson<{ user: SessionUser }>('/api/auth/me')
      .then((r) => {
        if (!cancelled) setUser(r.user)
      })
      .catch(() => {
        if (!cancelled) {
          setToken(null)
          setTokenState(null)
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const register = useCallback(
    async (input: {
      nickname: string
      realName: string
      password: string
    }): Promise<{ ok: true } | { ok: false; message: string }> => {
      try {
        const r = await apiJson<{ token: string; user: SessionUser }>('/api/auth/register', {
          json: input,
        })
        setToken(r.token)
        setTokenState(r.token)
        setUser(r.user)
        return { ok: true }
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : '注册失败' }
      }
    },
    [],
  )

  const login = useCallback(async (nickname: string, password: string) => {
    try {
      const r = await apiJson<{ token: string; user: SessionUser }>('/api/auth/login', {
        json: { nickname, password },
      })
      setToken(r.token)
      setTokenState(r.token)
      setUser(r.user)
      return { ok: true as const }
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : '登录失败' }
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setTokenState(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, authLoading, register, login, logout }),
    [token, user, authLoading, register, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
