"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { TechnicianOnly } from "@/components/role-guards"
import { getApiClient, type AssignedShiftInfo } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/components/ui/use-toast"

function getShiftType(startTime: string): "Morning" | "Afternoon" | "Night" {
  const hour = parseInt(startTime.split(":")[0] || "0", 10)
  if (hour >= 7 && hour < 13) return "Morning"
  if (hour >= 13 && hour < 18) return "Afternoon"
  return "Night"
}

export default function TechnicianShiftsPage() {
  const api = useMemo(() => getApiClient(), [])
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<AssignedShiftInfo[]>([])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const profile = await api.getProfile()
      const myId = profile.data._id
      const res = await api.getShiftAssignmentsByUser(myId)
      // Sort upcoming first by date/time
      const sorted = [...res].sort((a, b) => new Date(a.shift_date).getTime() - new Date(b.shift_date).getTime())
      setItems(sorted)
    } catch (e: any) {
      toast({ title: "Không tải được lịch làm việc", description: e?.message || "Failed to load shifts", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [api, toast])

  useEffect(() => { load() }, [load])

  return (
    <TechnicianOnly>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Shifts</h1>
          <p className="text-muted-foreground">Xem các ca làm việc được phân công</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lịch phân ca</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Spinner /> Loading...</div>
            ) : items.length === 0 ? (
              <div className="text-muted-foreground">Chưa có ca làm việc nào.</div>
            ) : (
              <div className="divide-y">
                {items.map((s) => (
                  <div key={s._id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {new Date(s.shift_date).toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {s.start_time} - {s.end_time} • {getShiftType(s.start_time)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground uppercase">{s.status}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TechnicianOnly>
  )
}
