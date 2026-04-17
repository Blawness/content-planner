'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

export type User = {
  id: string
  email: string
  isSuperuser?: boolean
}

type AuthContextType = {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'content_planner_token'
const USER_KEY = 'content_planner_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = () => {
      if (typeof window === 'undefined') return
      const storedToken = sessionStorage.getItem(TOKEN_KEY)
      const storedUser = sessionStorage.getItem(USER_KEY)
      if (storedToken && storedUser) {
        setToken(storedToken)
        document.cookie = `content_planner_token=${storedToken}; path=/; max-age=86400; SameSite=Lax`
        try {
          setUser(JSON.parse(storedUser))
        } catch {
          sessionStorage.removeItem(USER_KEY)
          sessionStorage.removeItem(TOKEN_KEY)
          document.cookie = 'content_planner_token=; path=/; max-age=0'
        }
      }
      setIsLoading(false)
    }
    init()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
    const url = baseUrl ? `${baseUrl}/auth/login` : '/api/auth/login'
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Login failed')
    }
    const data = await res.json()
    const t = data.token ?? data.accessToken
    const u = data.user ?? { id: data.userId ?? data.sub, email }
    if (t) {
      setToken(t)
      setUser(u)
      sessionStorage.setItem(TOKEN_KEY, t)
      sessionStorage.setItem(USER_KEY, JSON.stringify(u))
      document.cookie = `content_planner_token=${t}; path=/; max-age=86400; SameSite=Lax`
    }
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
    const url = baseUrl ? `${baseUrl}/auth/register` : '/api/auth/register'
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Registration failed')
    }
    const data = await res.json()
    const t = data.token ?? data.accessToken
    const u = data.user ?? { id: data.userId ?? data.sub, email }
    if (t) {
      setToken(t)
      setUser(u)
      sessionStorage.setItem(TOKEN_KEY, t)
      sessionStorage.setItem(USER_KEY, JSON.stringify(u))
      document.cookie = `content_planner_token=${t}; path=/; max-age=86400; SameSite=Lax`
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    document.cookie = 'content_planner_token=; path=/; max-age=0'
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
