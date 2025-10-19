import type React from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { RequireAuth } from "@/components/role-guards"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <DashboardLayout>{children}</DashboardLayout>
    </RequireAuth>
  )
}
