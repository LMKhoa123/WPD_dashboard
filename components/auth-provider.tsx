"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { AuthUser, UserRole } from "@/src/types"
import { ApiClient, loadTokens, saveTokens, setGlobalApiClient, type Tokens } from "@/lib/api"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  loginWithCredentials: (identifier: string, password: string) => Promise<void>
  register: (email: string, password: string, role: UserRole, centerId: string) => Promise<void>
  logout: () => Promise<void>
  getAccessToken: () => string | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const USER_KEY = "evsc:user"

function mapApiRoleToUi(role: string | undefined | null): UserRole {
  switch (role) {
    case "ADMIN":
      return "Admin"
    case "STAFF":
      return "Staff"
    case "TECHNICIAN":
      return "Technician"
    default:
      return "Customer"
  }
}

function mapUiRoleToApi(role: UserRole): "ADMIN" | "STAFF" | "TECHNICIAN" {
  if (role === "Admin") return "ADMIN"
  if (role === "Technician") return "TECHNICIAN"
  return "STAFF"
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const api = useMemo(
    () =>
      new ApiClient({
        getTokens: loadTokens,
        setTokens: saveTokens,
        onUnauthorized: () => {
          setUser(null)
          try {
            localStorage.removeItem(USER_KEY)
          } catch {}
          router.replace("/login")
          toast.warning("Session expired. Please log in again.")
        },
      }),
    [router]
  )

  useEffect(() => {
    setGlobalApiClient(api)
  }, [api])

  useEffect(() => {
    const initAuth = async () => {
      try {
        const raw = localStorage.getItem(USER_KEY)
        if (!raw) {
          setLoading(false)
          return
        }

        const storedUser = JSON.parse(raw)
        const tokens = loadTokens()
        
        if (!tokens) {
          localStorage.removeItem(USER_KEY)
          setLoading(false)
          return
        }

        const now = Date.now()
        const isAccessTokenExpired = tokens.accessTokenExpiresAt <= now

        if (isAccessTokenExpired) {
          try {
            await api.refreshToken()
            setUser(storedUser)
          } catch (error) {
            console.error("Failed to refresh token on mount:", error)
            localStorage.removeItem(USER_KEY)
          }
        } else {
          try {
            const profile = await api.getProfile()
            const centerId: string | null = (profile?.data as any)?.centerId ?? storedUser?.centerId ?? null
            const merged = { ...storedUser, centerId }
            setUser(merged)
            localStorage.setItem(USER_KEY, JSON.stringify(merged))
          } catch {
            setUser(storedUser)
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        localStorage.removeItem(USER_KEY)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [api])

  const persistUser = (u: AuthUser | null) => {
    setUser(u)
    try {
      if (u) localStorage.setItem(USER_KEY, JSON.stringify(u))
      else localStorage.removeItem(USER_KEY)
    } catch {}
  }

  const loginWithCredentials = async (identifier: string, password: string) => {
    try {
      const res = await api.login({ identifier, password })
      const role = mapApiRoleToUi(res.data.role)
      let centerId: string | null = null
      try {
        const profile = await api.getProfile()
        centerId = (profile?.data as any)?.centerId ?? null
      } catch {}
      const name = identifier.includes("@") ? identifier.split("@")[0] : identifier
      persistUser({ name, email: identifier, role, centerId })
      toast.success(res.message)
    } catch (e: any) {
      toast.error(e?.message || "Login error")
      throw e
    }
  }

  const register = async (email: string, password: string, role: UserRole, centerId: string) => {
    try {
      const roleApi = mapUiRoleToApi(role)
      const res = await api.register({ email, password, role: roleApi, centerId })
      toast.success(res.message)
    } catch (e: any) {
      toast.error(e?.message || "Register error")
      throw e
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } finally {
      persistUser(null)
    }
  }

  const getAccessToken = () => {
    const t: Tokens | null = loadTokens()
    return t?.accessToken || null
  }

  const value = useMemo(
    () => ({ user, loading, loginWithCredentials, register, logout, getAccessToken }),
    [user, loading]
  )
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  
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

export function useIsStaff() {
  const { user } = useAuth()
  return user?.role === "Staff"
}

export function useRole(): UserRole | null {
  const { user } = useAuth()
  return user?.role ?? null
}
