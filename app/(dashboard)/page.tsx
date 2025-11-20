"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DollarSign, Users, Car, Wrench } from "lucide-react"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { WorkStatusChart } from "@/components/dashboard/work-status-chart"
import { RecentAppointments } from "@/components/dashboard/recent-appointments"
import { mockCustomers, mockVehicles, mockAppointments } from "@/src/lib/mock-data"
import { useAuth } from "@/components/auth-provider"
import { formatVND } from "@/lib/utils"

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user?.role === "Technician") router.replace("/technician")
    else if (user?.role === "Staff") router.replace("/staff-home")
    else if (user?.role === "Admin") router.replace("/admin")
  }, [user, router])

  if (user?.role === "Technician" || user?.role === "Staff" || user?.role === "Admin") {
    return null
  }

  const totalRevenue = 37000
  const activeAppointments = mockAppointments.filter(
    (apt) => apt.status === "confirmed" || apt.status === "in-progress",
  ).length
  const totalCustomers = mockCustomers.length
  const totalVehicles = mockVehicles.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your service center.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Revenue"
          value={formatVND(totalRevenue)}
          change="+12.5% from last week"
          changeType="positive"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KpiCard
          title="Active Appointments"
          value={activeAppointments}
          change={`${activeAppointments} scheduled today`}
          changeType="neutral"
          icon={<Wrench className="h-4 w-4" />}
        />
        <KpiCard
          title="Total Customers"
          value={totalCustomers}
          change="+3 new this week"
          changeType="positive"
          icon={<Users className="h-4 w-4" />}
        />
        <KpiCard
          title="Vehicles Serviced"
          value={totalVehicles}
          change="20 vehicles registered"
          changeType="neutral"
          icon={<Car className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RevenueChart />
        <WorkStatusChart />
      </div>

      <RecentAppointments />
    </div>
  )
}
