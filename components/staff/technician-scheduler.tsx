"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { mockStaff, mockAppointments } from "@/src/lib/mock-data"

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const shifts = [
  { id: "morning", label: "Morning (8:00-12:00)" },
  { id: "afternoon", label: "Afternoon (13:00-17:00)" },
  { id: "evening", label: "Evening (17:00-21:00)" },
]

export function TechnicianScheduler() {
  const technicians = mockStaff.filter((s) => s.role === "Technician" && s.status === "Active")
  const [weekOffset, setWeekOffset] = useState(0)
  const [assignments, setAssignments] = useState<Record<string, string | null>>({})

  const weekStart = useMemo(() => {
    const d = new Date()
    const day = d.getDay() || 7
    d.setDate(d.getDate() - day + 1 + weekOffset * 7)
    d.setHours(0, 0, 0, 0)
    return d
  }, [weekOffset])

  const keyFor = (dayIdx: number, shiftId: string) => `${weekStart.toDateString()}-${dayIdx}-${shiftId}`

  const assign = (k: string, staffId: string | null) => setAssignments((prev) => ({ ...prev, [k]: staffId }))

  const utilization = useMemo(() => {
    // Mock utilization based on appointments per technician in visible week
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    const counts: Record<string, number> = {}
    mockAppointments.forEach((a) => {
      if (a.startTime >= start && a.startTime < end) {
        const tech = mockStaff.find((s) => s.name === a.technician)
        if (tech) counts[tech.id] = (counts[tech.id] || 0) + 1
      }
    })
    return counts
  }, [weekStart])

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Technician Scheduling</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setWeekOffset((w) => w - 1)}>
            Previous Week
          </Button>
          <Button variant="outline" onClick={() => setWeekOffset(0)}>This Week</Button>
          <Button variant="outline" onClick={() => setWeekOffset((w) => w + 1)}>
            Next Week
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shift</TableHead>
                {days.map((d) => (
                  <TableHead key={d}>{d}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">{shift.label}</TableCell>
                  {days.map((_, dayIdx) => {
                    const k = keyFor(dayIdx, shift.id)
                    const selected = assignments[k] || "none"
                    return (
                      <TableCell key={k}>
                        <Select value={selected} onValueChange={(v) => assign(k, v === "none" ? null : v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {technicians.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <span className="font-medium">Weekly utilization (mock): </span>
          {Object.keys(utilization).length === 0 && <span>No assignments/appointments this week.</span>}
          {Object.entries(utilization).map(([staffId, count]) => {
            const t = technicians.find((x) => x.id === staffId)
            return (
              <span key={staffId} className="mr-3">
                {t?.name}: {count} appointments
              </span>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
