"use client"

import React from "react"
import CalendarShiftView from "@/components/staff/calendar-shift-view"
import { AdminOrStaffOnly } from "@/components/role-guards"

export default function ShiftAssignmentsPage() {
  return (
    <AdminOrStaffOnly>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shift Calendar</h1>
          <p className="text-muted-foreground">Assign technicians and staff by shift/schedule. Admin and Staff can create, edit, or delete assignments.</p>
        </div>
        <CalendarShiftView />
      </div>
    </AdminOrStaffOnly>
  )
}
