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
          <p className="text-muted-foreground">Phân công kỹ thuật viên theo ca/lịch. Admin và Staff có thể tạo, chỉnh sửa, hoặc xóa phân công.</p>
        </div>
        <CalendarShiftView />
      </div>
    </AdminOrStaffOnly>
  )
}
