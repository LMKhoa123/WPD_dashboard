"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { mockAppointments } from "@/src/lib/mock-data"
import { format } from "date-fns"
import type { AppointmentStatus } from "@/src/types"

const statusColors: Record<AppointmentStatus, string> = {
  pending: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  "in-progress": "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
  completed: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  cancelled: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
}

export function RecentAppointments() {
  const upcomingAppointments = mockAppointments
    .filter((apt) => apt.status === "pending" || apt.status === "in-progress" || apt.status === "confirmed")
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Appointments</CardTitle>
        <CardDescription>Upcoming and in-progress service appointments</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {upcomingAppointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell className="font-medium">{appointment.customerName}</TableCell>
                <TableCell>{appointment.vehicleName}</TableCell>
                <TableCell>{appointment.service}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(appointment.startTime, "MMM d, h:mm a")}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusColors[appointment.status]}>
                    {appointment.status.replace("-", " ")}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
