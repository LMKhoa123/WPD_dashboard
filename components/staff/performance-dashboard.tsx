"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { mockStaff, mockAppointments } from "@/src/lib/mock-data"

export function PerformanceDashboard() {
  const technicians = mockStaff.filter((s) => s.role === "Technician")

  const kpis = technicians.map((t) => {
    const total = mockAppointments.filter((a) => a.technician === t.name).length
    const completed = mockAppointments.filter((a) => a.technician === t.name && a.status === "completed").length
    const inProgress = mockAppointments.filter((a) => a.technician === t.name && a.status === "in-progress").length
    const scheduled = mockAppointments.filter((a) => a.technician === t.name && a.status === "scheduled").length
    // Mock hours: assume 1.5h per completed
    const hours = (completed * 1.5).toFixed(1)
    return { t, total, completed, inProgress, scheduled, hours }
  })

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {kpis.map(({ t, total, completed, inProgress, scheduled, hours }) => (
        <Card key={t.id}>
          <CardHeader>
            <CardTitle className="text-base">{t.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Total Jobs</div>
              <div className="text-xl font-semibold">{total}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Completed</div>
              <div className="text-xl font-semibold text-green-500">{completed}</div>
            </div>
            <div>
              <div className="text-muted-foreground">In Progress</div>
              <div className="text-xl font-semibold text-amber-500">{inProgress}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Scheduled</div>
              <div className="text-xl font-semibold">{scheduled}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Est. Hours (mock)</div>
              <div className="text-xl font-semibold">{hours}h</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
