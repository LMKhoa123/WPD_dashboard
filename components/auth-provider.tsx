"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { AuthUser, UserRole } from "@/src/types"
import { ApiClient, loadTokens, saveTokens, setGlobalApiClient, type Tokens } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  loginWithCredentials: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, role: UserRole) => Promise<void>
  logout: () => Promise<void>
  getAccessToken: () => string | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const USER_KEY = "evsc:user"

// Map API role (e.g., "ADMIN") to UI role type ("Admin")
function mapApiRoleToUi(role: string | undefined | null): UserRole {
  switch (role) {
    case "ADMIN":
      return "Admin"
    case "STAFF":
      return "Staff"
    default:
      // Fallback to Staff for unknown roles
      return "Staff"
  }
}

function mapUiRoleToApi(role: UserRole): "ADMIN" | "STAFF" {
  return role === "Admin" ? "ADMIN" : "STAFF"
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Create API client with redirect callback
  const api = useMemo(
    () =>
      new ApiClient({
        getTokens: loadTokens,
        setTokens: saveTokens,
        onUnauthorized: () => {
          // Clear user state
          setUser(null)
          try {
            localStorage.removeItem(USER_KEY)
          } catch {}
          // Redirect to login
          router.replace("/login")
          toast({
            title: "Phiên đăng nhập hết hạn",
            description: "Vui lòng đăng nhập lại",
            variant: "destructive",
          })
        },
      }),
    [router]
  )

  // Set as global API client
  useEffect(() => {
    setGlobalApiClient(api)
  }, [api])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_KEY)
      if (raw) {
        const storedUser = JSON.parse(raw)
        // Check if tokens still exist and are valid
        const tokens = loadTokens()
        if (tokens) {
          // Check if refresh token is expired (compare with current time)
          // Note: We don't have refresh token expiry in our Tokens type, so we'll just check existence
          setUser(storedUser)
        } else {
          // No tokens found, clear user
          localStorage.removeItem(USER_KEY)
        }
      }
    } catch {}
    setLoading(false)
  }, [])

  const persistUser = (u: AuthUser | null) => {
    setUser(u)
    try {
      if (u) localStorage.setItem(USER_KEY, JSON.stringify(u))
      else localStorage.removeItem(USER_KEY)
    } catch {}
  }

  const loginWithCredentials = async (email: string, password: string) => {
    try {
      const res = await api.login({ email, password })
      const role = mapApiRoleToUi(res.data.role)
      const name = email.split("@")[0]
      persistUser({ name, email, role })
      toast({ title: "Đăng nhập thành công", description: res.message })
    } catch (e: any) {
      toast({ title: "Đăng nhập thất bại", description: e?.message || "Login error" })
      throw e
    }
  }

  const register = async (email: string, password: string, role: UserRole) => {
    try {
      const roleApi = mapUiRoleToApi(role)
      const res = await api.register({ email, password, role: roleApi })
      toast({ title: "Đăng ký thành công", description: res.message })
    } catch (e: any) {
      toast({ title: "Đăng ký thất bại", description: e?.message || "Register error" })
      throw e
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } finally {
      // Clear user regardless of API result
      persistUser(null)
    }
  }

  const getAccessToken = () => {
    const t: Tokens | null = loadTokens()
    return t?.accessToken || null
  }

  const value = useMemo(
    () => ({ user, loading, loginWithCredentials, register, logout, getAccessToken }),
    [user, loading, api]
  )
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
