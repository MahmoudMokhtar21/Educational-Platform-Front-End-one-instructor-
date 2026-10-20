import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { clearAuthSession, persistAuthSession } from '../api/client'
import { authService } from '../api/services'
import type { LoginRequest, LoginResponse, RegisterRequest, User } from '../types/api'

type AuthValue = {
  user: User | null
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  updateUser: (user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)
const userKey = 'edu_user'

const readSavedUser = (): User | null => {
  const saved = localStorage.getItem(userKey)
  if (!saved) return null

  try {
    return JSON.parse(saved) as User
  } catch {
    // A stale or manually edited value must never prevent the application shell from mounting.
    localStorage.removeItem(userKey)
    clearAuthSession()
    return null
  }
}

const toUser = (session: LoginResponse): User => ({
  userId: session.userId,
  email: session.email,
  firstName: session.firstName,
  lastName: session.lastName,
  profilePictureUrl: session.profilePictureUrl,
  role: session.role
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(readSavedUser)

  const clearLocalSession = useCallback(() => {
    clearAuthSession()
    localStorage.removeItem(userKey)
    setUser(null)
  }, [])

  const logout = useCallback(() => {
    // logoutSession captures the CSRF value before this synchronous local cleanup.
    void authService.logout().catch(() => undefined)
    clearLocalSession()
  }, [clearLocalSession])

  useEffect(() => {
    const handleUnauthorized = () => clearLocalSession()
    window.addEventListener('edu:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('edu:unauthorized', handleUnauthorized)
  }, [clearLocalSession])

  const login = async (data: LoginRequest) => {
    const result = await authService.login(data)
    const nextUser = toUser(result)
    persistAuthSession(result)
    localStorage.setItem(userKey, JSON.stringify(nextUser))
    setUser(nextUser)
  }

  const register = async (data: RegisterRequest) => {
    await authService.register(data)
  }

  const updateUser = (nextUser: User) => {
    localStorage.setItem(userKey, JSON.stringify(nextUser))
    setUser(nextUser)
  }

  return <AuthContext.Provider value={{ user, login, register, updateUser, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
