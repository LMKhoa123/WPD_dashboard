"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : ""
      router.replace(`/login${next}`)
    }
  }, [user, loading, router, pathname])

  if (loading) return null
  if (!user) return null
  return <>{children}</>
}

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && user.role !== "Admin") {
      router.replace("/")
    }
  }, [user, loading, router])

  if (loading) return null
  if (!user || user.role !== "Admin") return null
  return <>{children}</>
}

export function TechnicianOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && user.role !== "Technician") {
      router.replace("/")
    }
  }, [user, loading, router])

  if (loading) return null
  if (!user || user.role !== "Technician") return null
  return <>{children}</>
}

export function AdminOrStaffOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && user.role !== "Admin" && user.role !== "Staff") {
      router.replace("/")
    }
  }, [user, loading, router])

  if (loading) return null
  if (!user || (user.role !== "Admin" && user.role !== "Staff")) return null
  return <>{children}</>
}

export function AdminStaffTechnicianOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && user.role !== "Admin" && user.role !== "Staff" && user.role !== "Technician") {
      router.replace("/")
    }
  }, [user, loading, router])

  if (loading) return null
  if (!user || (user.role !== "Admin" && user.role !== "Staff" && user.role !== "Technician")) return null
  return <>{children}</>
}
