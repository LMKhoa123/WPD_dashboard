"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { getApiClient, type ServiceRecordRecord } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { Clock, CheckCircle2, AlertCircle, FileText } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { MyShiftsCalendar } from "@/components/technician/my-shifts-calendar"

export default function TechnicianDashboardPage() {
  const [records, setRecords] = useState<ServiceRecordRecord[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()

  const api = useMemo(() => getApiClient(), [])

  const [technicianId, setTechnicianId] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await api.getProfile()
        setTechnicianId(profile.data._id)
      } catch (e: any) {
        toast.error(e?.message || "Failed to load profile")
      }
    }
    loadProfile()
  }, [api, toast])

  const load = useCallback(async () => {
    if (!technicianId) return
    
    try {
      setLoading(true)
      const res = await api.getServiceRecords({ limit: 500 })
      const myRecords = res.data.records.filter(r => {
        const tid = typeof r.technician_id === 'string' ? r.technician_id : r.technician_id?._id
        return tid === technicianId
      })
      setRecords(myRecords)
    } catch (e: any) {
      toast.error(e?.message || "Failed to load service records")
    } finally {
      setLoading(false)
    }
  }, [api, toast, technicianId])

  useEffect(() => {
    load()
  }, [load])

  const pendingCount = records.filter(r => r.status === "pending").length
  const inProgressCount = records.filter(r => r.status === "in-progress").length
  const completedCount = records.filter(r => r.status === "completed").length

  const recentRecords = records.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Hello, {user?.name || "Technician"}! This is your work overview.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Shift Calendar */}
          {technicianId && (
            <MyShiftsCalendar systemUserId={technicianId} />
          )}

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{records.length}</div>
                <p className="text-xs text-muted-foreground">Total service records</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingCount}</div>
                <p className="text-xs text-muted-foreground">Waiting to start</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <AlertCircle className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inProgressCount}</div>
                <p className="text-xs text-muted-foreground">Currently working</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedCount}</div>
                <p className="text-xs text-muted-foreground">Successfully finished</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Service Records</CardTitle>
              <CardDescription>Your recent service records</CardDescription>
            </CardHeader>
            <CardContent>
              {recentRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No service records yet
                </div>
              ) : (
                <div className="space-y-4">
                  {recentRecords.map((rec) => {
                    const appointment = typeof rec.appointment_id === 'object' ? rec.appointment_id : null
                    const vehicle = appointment && typeof appointment.vehicle_id === 'object' 
                      ? appointment.vehicle_id?.vehicleName 
                      : "N/A"
                    
                    return (
                      <div key={rec._id} className="flex items-center justify-between border-b pb-4 last:border-0">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{vehicle}</p>
                          <p className="text-sm text-muted-foreground">
                            {rec.description || "No description"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(rec.start_time).toLocaleDateString()} - {new Date(rec.end_time).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          rec.status === "completed" ? "bg-green-500/10 text-green-500" :
                          rec.status === "in-progress" ? "bg-blue-500/10 text-blue-500" :
                          rec.status === "pending" ? "bg-yellow-500/10 text-yellow-500" :
                          "bg-gray-500/10 text-gray-500"
                        }`}>
                          {rec.status}
                        </div>
                      </div>
                    )
                  })}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => router.push("/technician/service-records")}
                  >
                    View All Records
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
