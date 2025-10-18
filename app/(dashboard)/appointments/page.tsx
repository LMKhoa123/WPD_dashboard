"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockAppointments } from "@/src/lib/mock-data"
import { format } from "date-fns"
import { Search, Pencil, Trash2 } from "lucide-react"
import { AppointmentDialog } from "@/components/appointments/appointment-dialog"
import type { AppointmentStatus } from "@/src/types"

const statusColors = {
  scheduled: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  "in-progress": "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
  completed: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  cancelled: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
}

export default function AppointmentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all")

  const filteredAppointments = mockAppointments
    .filter((apt) => {
      const matchesSearch =
        apt.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.vehicleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.service.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || apt.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">Manage service appointments and schedules</p>
        </div>
        <AppointmentDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Appointments</CardTitle>
          <CardDescription>View and manage all service appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by customer, vehicle, or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AppointmentStatus | "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">{appointment.customerName}</TableCell>
                    <TableCell>{appointment.vehicleName}</TableCell>
                    <TableCell>{appointment.service}</TableCell>
                    <TableCell className="text-muted-foreground">{appointment.technician}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(appointment.startTime, "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[appointment.status]}>
                        {appointment.status.replace("-", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <AppointmentDialog
                          appointment={appointment}
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
