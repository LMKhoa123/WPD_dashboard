"use client"

import React, { useState, useMemo, useCallback, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Calendar as CalendarIcon, Clock, Plus, User, Pencil, Trash2 } from "lucide-react"
import { getApiClient, type WorkshiftRecord, type UserAccount, type SystemUserRecord } from "@/lib/api"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

type ShiftType = "morning" | "evening" | "night"

const shiftColors: Record<ShiftType, string> = {
  "morning": "bg-yellow-400",
  "evening": "bg-orange-400",
  "night": "bg-purple-500"
}

const shiftLabels: Record<ShiftType, string> = {
  "morning": "Morning",
  "evening": "Afternoon",
  "night": "Night"
}

const shiftTimeRanges: Record<ShiftType, { start: string; end: string }> = {
  "morning": { start: "07:00", end: "12:00" },
  "evening": { start: "13:00", end: "17:00" },
  "night": { start: "18:00", end: "20:00" }
}

function getShiftType(startTime: string, endTime: string): ShiftType {
  // Map by hour ranges aligned with shiftTimeRanges
  // Morning: 07:00 - <13:00
  // Afternoon: 13:00 - <18:00
  // Night: >=18:00 (and anything before 07:00)
  const [hStr] = startTime.split(':')
  const start = parseInt(hStr, 10)

  if (start >= 7 && start < 13) return "morning"
  if (start >= 13 && start < 18) return "evening"
  return "night"
}

interface ShiftAssignment {
  _id: string
  system_user_id: string
  shift_id: string
  userName: string
  userEmail: string
  date: string
  shiftType: ShiftType
  startTime: string
  endTime: string
}

type RoleFilter = "ALL" | "TECHNICIAN" | "STAFF"

type Member = {
  systemUserId: string
  userAccountId?: string
  email?: string
  name?: string
  role: string // "STAFF" | "TECHNICIAN" | others
}

export function CalendarShiftView() {
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [workshifts, setWorkshifts] = useState<WorkshiftRecord[]>([])
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL")
  const [loading, setLoading] = useState(false)
  const filteredMembers = useMemo(() => {
    if (roleFilter === "ALL") return members
    return members.filter(m => m.role === roleFilter)
  }, [members, roleFilter])
  
  // New Shift Modal state
  const [newShiftModalOpen, setNewShiftModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedShiftType, setSelectedShiftType] = useState<ShiftType>("morning")
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  // Edit Modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<ShiftAssignment | null>(null)
  const [editDate, setEditDate] = useState<Date | undefined>(new Date())
  const [editShiftType, setEditShiftType] = useState<ShiftType>("morning")
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingAssignment, setDeletingAssignment] = useState<ShiftAssignment | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const api = getApiClient()
      // Load workshifts, system users (staff profiles) and user accounts for role mapping
      const [ws, sysUsersResp, allUsers] = await Promise.all([
        api.getWorkshifts(),
        api.getSystemUsers({ limit: 500 }),
        api.getUsers({ page: 1, limit: 1000 })
      ])
      
      // Filter for selected month
      const filtered = ws.filter(w => {
        const date = new Date(w.shift_date)
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
      })
      
      setWorkshifts(filtered)

      const usersById = new Map(allUsers.map(u => [u._id, u]))
      const sysUsers = sysUsersResp.data.systemUsers
      const mappedMembers: Member[] = sysUsers.map((su) => {
        let userAccountId: string | undefined
        let email: string | undefined
        let role: string = ""
        if (typeof su.userId === "object") {
          userAccountId = su.userId._id
          email = su.userId.email
          role = (su.userId as any).role || ""
        } else if (typeof su.userId === "string") {
          userAccountId = su.userId
          const acc = usersById.get(su.userId)
          email = acc?.email
          role = acc?.role || ""
        }
        return {
          systemUserId: su._id,
          userAccountId,
          email,
          name: su.name,
          role,
        }
      })
      // Keep only Staff or Technician
      const onlyRelevant = mappedMembers.filter(m => m.role === "TECHNICIAN" || m.role === "STAFF")
      setMembers(onlyRelevant)
      
      // Load assignments for all workshifts
      const allAssignments: ShiftAssignment[] = []
      for (const ws of filtered) {
        try {
          const userIds = await api.getShiftAssignmentsByShift(ws.shift_id)
          userIds.forEach(userId => {
            const member = onlyRelevant.find(m => m.systemUserId === userId)
            if (member) {
              allAssignments.push({
                _id: `${ws._id}-${userId}`,
                system_user_id: userId,
                shift_id: ws.shift_id,
                userName: member.name || member.email?.split('@')[0] || 'Unknown',
                userEmail: member.email || '',
                date: ws.shift_date,
                shiftType: getShiftType(ws.start_time, ws.end_time),
                startTime: ws.start_time,
                endTime: ws.end_time
              })
            }
          })
        } catch (err) {
          // Skip if no assignments
        }
      }
      setShiftAssignments(allAssignments)
      
    } catch (err: any) {
      toast({
        title: "Lỗi tải dữ liệu",
        description: err?.message || "Failed to load data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Visible members based on role filter
  const visibleUserIds = useMemo(() => new Set(filteredMembers.map(m => m.systemUserId)), [filteredMembers])

  // Get assignments for a specific date (respect role filter)
  const getAssignmentsForDate = useCallback((dateStr: string) => {
    return shiftAssignments.filter(a => a.date.startsWith(dateStr) && visibleUserIds.has(a.system_user_id))
  }, [shiftAssignments, visibleUserIds])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth, 1)
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0)
    const daysInMonth = lastDay.getDate()
    // Align to Monday as first day
    const startDaySundayFirst = firstDay.getDay() // 0 = Sunday
    const offset = (startDaySundayFirst + 6) % 7 // Monday = 0, Sunday = 6

    const days: Array<{
      date: number | null
      isCurrentMonth: boolean
      dateStr: string
      assignments: ShiftAssignment[]
    }> = []

    // Previous month days
    const prevMonthDays = new Date(selectedYear, selectedMonth, 0).getDate()
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear

    for (let i = offset; i > 0; i--) {
      const day = prevMonthDays - i + 1
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      days.push({ date: day, isCurrentMonth: false, dateStr, assignments: [] })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      const dayAssignments = getAssignmentsForDate(dateStr)
      days.push({ date: i, isCurrentMonth: true, dateStr, assignments: dayAssignments })
    }

    // Next month days to fill grid to full weeks (multiple of 7)
    const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1
    const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear
    let i = 1
    while (days.length % 7 !== 0) {
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      days.push({ date: i, isCurrentMonth: false, dateStr, assignments: [] })
      i++
    }

    return days
  }, [selectedYear, selectedMonth, getAssignmentsForDate])

  // Recent assignments (last 5)
  const recentAssignments = useMemo(() => {
    return [...shiftAssignments]
      .filter(a => visibleUserIds.has(a.system_user_id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  }, [shiftAssignments, visibleUserIds])

  // Calculate attendance stats by day of week
  const attendanceStats = useMemo(() => {
    const stats = {
      Mon: { morning: 0, evening: 0, night: 0 },
      Tue: { morning: 0, evening: 0, night: 0 },
      Wed: { morning: 0, evening: 0, night: 0 },
      Thu: { morning: 0, evening: 0, night: 0 },
      Fri: { morning: 0, evening: 0, night: 0 },
      Sat: { morning: 0, evening: 0, night: 0 },
      Sun: { morning: 0, evening: 0, night: 0 }
    }
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    shiftAssignments.forEach(a => {
      if (!visibleUserIds.has(a.system_user_id)) return
      const date = new Date(a.date)
      const dayName = dayNames[date.getDay()] as keyof typeof stats
      
      if (a.shiftType === "morning") {
        stats[dayName].morning += 1
      } else if (a.shiftType === "evening") {
        stats[dayName].evening += 1
      } else {
        stats[dayName].night += 1
      }
    })
    
    return stats
  }, [shiftAssignments, visibleUserIds])

  const maxAttendance = Math.max(
    ...Object.values(attendanceStats).flatMap(v => [v.morning, v.night]),
    1
  )

  // Handle create new shift
  const handleCreateShift = async () => {
    if (!selectedDate || selectedStaff.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select date and at least one staff member",
        variant: "destructive"
      })
      return
    }

    try {
      setSaving(true)
      const api = getApiClient()
      
      // Format date
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const timeRange = shiftTimeRanges[selectedShiftType]
      
      // Create workshift first
      const shiftId = `shift-${dateStr}-${selectedShiftType}`
      
      try {
        await api.createWorkshift({
          shift_id: shiftId,
          shift_date: dateStr,
          start_time: timeRange.start,
          end_time: timeRange.end,
          status: "active",
          center_id: "default"
        })
      } catch (err) {
        // Workshift might already exist, continue
      }
      
      // Assign staff to shift
      await api.assignShifts({
        system_user_id: selectedStaff[0], // system user (staff) IDs
        shift_ids: [shiftId]
      })
      
      // If multiple staff, assign them one by one
      for (let i = 1; i < selectedStaff.length; i++) {
        await api.assignShifts({
          system_user_id: selectedStaff[i],
          shift_ids: [shiftId]
        })
      }
      
      toast({
        title: "Success",
        description: `Assigned ${selectedStaff.length} staff to ${shiftLabels[selectedShiftType]} shift`
      })
      
      // Reset and reload
      setNewShiftModalOpen(false)
      setSelectedStaff([])
      setSelectedDate(new Date())
      setSelectedShiftType("morning")
      loadData()
      
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to create shift assignment",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleNewShift = () => {
    setSelectedDate(new Date())
    setSelectedStaff([])
    setSelectedShiftType("morning")
    setNewShiftModalOpen(true)
  }

  // Handle edit assignment
  const handleEditClick = (assignment: ShiftAssignment) => {
    setEditingAssignment(assignment)
    setEditDate(new Date(assignment.date))
    setEditShiftType(assignment.shiftType)
    setEditModalOpen(true)
  }

  const handleUpdateAssignment = async () => {
    if (!editingAssignment || !editDate) return

    try {
      setSaving(true)
      const api = getApiClient()
      
      const dateStr = format(editDate, 'yyyy-MM-dd')
      const timeRange = shiftTimeRanges[editShiftType]
      
      // Create new workshift with updated details
      const newShiftId = `shift-${dateStr}-${editShiftType}`
      
      try {
        await api.createWorkshift({
          shift_id: newShiftId,
          shift_date: dateStr,
          start_time: timeRange.start,
          end_time: timeRange.end,
          status: "active",
          center_id: "default"
        })
      } catch (err) {
        // Shift might exist
      }
      
      // Get all assignments for this user to find the real _id
      const userAssignments = await api.getShiftAssignmentsByUser(editingAssignment.system_user_id)
      const assignmentToDelete = userAssignments.find(a => 
        a.shift_id === editingAssignment.shift_id
      )
      
      if (assignmentToDelete && assignmentToDelete._id) {
        await api.deleteShiftAssignment(assignmentToDelete._id)
      }
      
      // Create new assignment
      await api.assignShifts({
        system_user_id: editingAssignment.system_user_id,
        shift_ids: [newShiftId]
      })
      
      toast({
        title: "Success",
        description: "Shift assignment updated successfully"
      })
      
      setEditModalOpen(false)
      setEditingAssignment(null)
      loadData()
      
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to update assignment",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle delete assignment
  const handleDeleteClick = (assignment: ShiftAssignment) => {
    setDeletingAssignment(assignment)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingAssignment) return

    try {
      setSaving(true)
      const api = getApiClient()
      
      // Get all assignments for this user to find the real _id
      const userAssignments = await api.getShiftAssignmentsByUser(deletingAssignment.system_user_id)
      const assignmentToDelete = userAssignments.find(a => 
        a.shift_id === deletingAssignment.shift_id
      )
      
      if (assignmentToDelete && assignmentToDelete._id) {
        await api.deleteShiftAssignment(assignmentToDelete._id)
      } else {
        throw new Error("Assignment not found")
      }
      
      toast({
        title: "Success",
        description: "Shift assignment deleted successfully"
      })
      
      setDeleteDialogOpen(false)
      setDeletingAssignment(null)
      loadData()
      
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to delete assignment",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i)

  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Calendar</h1>
        <div className="flex items-center gap-3">
          {/* Role filter */}
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All members</SelectItem>
              <SelectItem value="TECHNICIAN">Technicians</SelectItem>
              <SelectItem value="STAFF">Staff</SelectItem>
            </SelectContent>
          </Select>
          <Select value={months[selectedMonth]} onValueChange={(v) => setSelectedMonth(months.indexOf(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, idx) => (
                <SelectItem key={month} value={month}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleNewShift} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            New Shift
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded bg-yellow-400" />
          <span>Morning</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded bg-orange-400" />
          <span>Afternoon</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded bg-purple-500" />
          <span>Night</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                const uniqueShiftTypes = Array.from(new Set(day.assignments.map(a => a.shiftType)))
                const isToday = day.date === currentDate.getDate() && 
                              day.isCurrentMonth && 
                              selectedMonth === currentDate.getMonth() && 
                              selectedYear === currentDate.getFullYear()
                
                return (
                  <Popover key={idx}>
                    <PopoverTrigger asChild>
                      <div
                        className={cn(
                          "aspect-square border rounded-lg p-2 flex flex-col cursor-pointer transition-all",
                          day.isCurrentMonth ? "bg-white border-gray-200 hover:shadow-md hover:border-indigo-300" : "bg-gray-50 border-gray-100",
                          isToday && "ring-2 ring-indigo-500 ring-offset-1"
                        )}
                      >
                        <div className={cn(
                          "text-sm font-medium mb-1 flex items-center justify-between",
                          day.isCurrentMonth ? "text-gray-800" : "text-gray-400"
                        )}>
                          <span>{day.date}</span>
                          <button
                            className="ml-auto text-indigo-600 hover:text-indigo-800 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (day.isCurrentMonth) {
                                setSelectedDate(new Date(day.dateStr))
                                setSelectedStaff([])
                                setSelectedShiftType("morning")
                                setNewShiftModalOpen(true)
                              }
                            }}
                            title="Add assignment"
                          >
                            + Add
                          </button>
                        </div>

                        {/* Shift rows with staff list */}
                        <div className="flex-1 space-y-1 overflow-hidden">
                          {uniqueShiftTypes.map(type => {
                            const staffForShift = day.assignments.filter(a => a.shiftType === type)
                            const staffNames = staffForShift.map(s => s.userName)
                            const preview = staffNames.slice(0, 2).join(', ')
                            const more = staffNames.length - 2
                            return (
                              <div key={type} className="text-[11px]" title={`${shiftLabels[type]}: ${shiftTimeRanges[type].start} - ${shiftTimeRanges[type].end}`}>
                                <div className="flex items-center gap-2">
                                  <span className={cn("inline-block w-2 h-2 rounded-full", shiftColors[type])} />
                                  <span className="font-medium text-gray-700 truncate">{shiftLabels[type]}</span>
                                  <span className="ml-auto text-gray-500">{staffForShift.length}</span>
                                </div>
                                {staffForShift.length > 0 && (
                                  <div className="pl-4 text-[10px] text-gray-600 truncate">
                                    {preview}{more > 0 ? ' +' + more : ''}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </PopoverTrigger>
                    
                    {/* Popover showing staff assignments */}
                    {day.assignments.length > 0 && (
                      <PopoverContent className="w-64 p-3" align="start">
                        <div className="space-y-2">
                          <div className="font-semibold text-sm text-gray-700 border-b pb-2">
                            {format(new Date(day.dateStr), 'MMMM d, yyyy')}
                          </div>
                          {uniqueShiftTypes.map(shiftType => {
                            const staffForShift = day.assignments.filter(a => a.shiftType === shiftType)
                            return (
                              <div key={shiftType} className="space-y-1">
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                  <div className={cn("w-2 h-2 rounded-full", shiftColors[shiftType])} />
                                  {shiftLabels[shiftType]} ({staffForShift.length})
                                </div>
                                <div className="pl-4 space-y-1">
                                  {staffForShift.map(staff => (
                                    <div key={staff._id} className="flex items-center justify-between gap-2 text-xs group">
                                      <div className="flex items-center gap-2">
                                        <User className="w-3 h-3 text-gray-400" />
                                        <span className="text-gray-700">{staff.userName}</span>
                                        <span className="text-gray-400 text-[10px]">
                                          {staff.startTime}-{staff.endTime}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0 hover:bg-blue-50"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleEditClick(staff)
                                          }}
                                        >
                                          <Pencil className="w-3 h-3 text-blue-600" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0 hover:bg-red-50"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteClick(staff)
                                          }}
                                        >
                                          <Trash2 className="w-3 h-3 text-red-600" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </PopoverContent>
                    )}
                  </Popover>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recently Added */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recently Added</h3>
                <span className="text-xs text-gray-500">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <div className="space-y-3">
                {recentAssignments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No recent assignments</p>
                ) : (
                  recentAssignments.map((assignment) => {
                    const date = new Date(assignment.date)
                    
                    return (
                      <div
                        key={assignment._id}
                        className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className={cn("w-1 rounded-full", shiftColors[assignment.shiftType])} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{assignment.userName}</h4>
                            <Badge variant="outline" className="text-xs">
                              {shiftLabels[assignment.shiftType]}
                            </Badge>
                            <button
                              className="ml-auto text-gray-400 hover:text-red-600 text-xs"
                              title="Delete assignment"
                              onClick={() => handleDeleteClick(assignment)}
                            >
                              ×
                            </button>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              {format(date, 'MMM d, yyyy')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {assignment.startTime} - {assignment.endTime}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shift Attendance */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Shift Attendance</h3>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-yellow-400" />
                    <span>Morning</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-purple-500" />
                    <span>Night</span>
                  </div>
                </div>
              </div>

              {/* Stats summary */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {Object.values(attendanceStats).reduce((sum, v) => sum + v.morning, 0)}
                  </div>
                  <div className="text-xs text-gray-600">Morning Shift</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {Object.values(attendanceStats).reduce((sum, v) => sum + v.night, 0)}
                  </div>
                  <div className="text-xs text-gray-600">Night Shift</div>
                </div>
              </div>

              {/* Bar chart */}
              <div className="space-y-1">
                <div className="flex items-end justify-between h-40 gap-2">
                  {Object.entries(attendanceStats).map(([day, counts]) => (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                      <div className="flex-1 w-full flex flex-col justify-end gap-1">
                        {counts.night > 0 && (
                          <div 
                            className="w-full bg-purple-500 rounded-t transition-all"
                            style={{ height: `${(counts.night / maxAttendance) * 100}%` }}
                            title={`Night: ${counts.night}`}
                          />
                        )}
                        {counts.morning > 0 && (
                          <div 
                            className="w-full bg-yellow-400 rounded-t transition-all"
                            style={{ height: `${(counts.morning / maxAttendance) * 100}%` }}
                            title={`Morning: ${counts.morning}`}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-600 px-1">
                  {Object.keys(attendanceStats).map(day => (
                    <span key={day} className="flex-1 text-center">{day}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Shift Modal */}
      <Dialog open={newShiftModalOpen} onOpenChange={setNewShiftModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Shift</DialogTitle>
            <DialogDescription>
              Assign staff members to a shift on a specific date
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Shift Type */}
            <div className="space-y-2">
              <Label>Shift Type</Label>
              <Select value={selectedShiftType} onValueChange={(v) => setSelectedShiftType(v as ShiftType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(shiftLabels) as ShiftType[]).map(type => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", shiftColors[type])} />
                        <span>{shiftLabels[type]}</span>
                        <span className="text-xs text-gray-500">
                          ({shiftTimeRanges[type].start} - {shiftTimeRanges[type].end})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Staff Selection */}
            <div className="space-y-2">
              <Label>Select Members ({selectedStaff.length} selected)</Label>
              <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto space-y-2">
                {filteredMembers.map(user => (
                  <label key={user.systemUserId} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedStaff.includes(user.systemUserId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStaff([...selectedStaff, user.systemUserId])
                        } else {
                          setSelectedStaff(selectedStaff.filter(id => id !== user.systemUserId))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{user.name || user.email?.split('@')[0] || user.systemUserId}</span>
                    <span className="ml-auto text-xs text-gray-500">{user.role}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewShiftModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateShift} disabled={saving || selectedStaff.length === 0}>
              {saving ? "Creating..." : "Create Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Shift Assignment</DialogTitle>
            <DialogDescription>
              Update shift details for {editingAssignment?.userName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editDate ? format(editDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker
                    mode="single"
                    selected={editDate}
                    onSelect={setEditDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Shift Type */}
            <div className="space-y-2">
              <Label>Shift Type</Label>
              <Select value={editShiftType} onValueChange={(v) => setEditShiftType(v as ShiftType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(shiftLabels) as ShiftType[]).map(type => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", shiftColors[type])} />
                        <span>{shiftLabels[type]}</span>
                        <span className="text-xs text-gray-500">
                          ({shiftTimeRanges[type].start} - {shiftTimeRanges[type].end})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAssignment} disabled={saving}>
              {saving ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the shift assignment for <strong>{deletingAssignment?.userName}</strong> on{" "}
              <strong>{deletingAssignment && format(new Date(deletingAssignment.date), 'PPP')}</strong>{" "}
              ({deletingAssignment && shiftLabels[deletingAssignment.shiftType]} shift).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default CalendarShiftView
