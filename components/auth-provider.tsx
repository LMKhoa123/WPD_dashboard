"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { AuthUser, UserRole } from "@/src/types"
import { useRouter } from "next/navigation"

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (user: AuthUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("evsc:user")
      if (raw) setUser(JSON.parse(raw))
    } catch {}
    setLoading(false)
  }, [])

  const login = (u: AuthUser) => {
    setUser(u)
    try {
      localStorage.setItem("evsc:user", JSON.stringify(u))
    } catch {}
  }

  const logout = () => {
    setUser(null)
    try {
      localStorage.removeItem("evsc:user")
    } catch {}
  }

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export function useIsAdmin() {
  const { user } = useAuth()
  return user?.role === "Admin"
}

export function useRole(): UserRole | null {
  const { user } = useAuth()
  return user?.role ?? null
}
