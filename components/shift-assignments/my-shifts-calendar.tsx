"use client"

import { useEffect, useState } from "react"
import { getApiClient, type AssignedShiftInfo } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { format, parseISO, startOfWeek, addDays, isSameDay } from "date-fns"
import { vi } from "date-fns/locale"
import { DataPagination } from "@/components/ui/data-pagination"

interface MyShiftsCalendarProps {
  systemUserId: string
}


function getShiftTimeColor(startTime: string): { bg: string; border: string; text: string; badge: string } {
  const hour = parseInt(startTime.split(":")[0] || "0", 10)
  
  
  if (hour >= 7 && hour < 13) {
    return {
      bg: "bg-amber-50 dark:bg-amber-950/20",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-900 dark:text-amber-100",
      badge: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
    }
  }
  
  
  if (hour >= 13 && hour < 18) {
    return {
      bg: "bg-blue-50 dark:bg-blue-950/20",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-900 dark:text-blue-100",
      badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
    }
  }
  
  
  return {
    bg: "bg-purple-50 dark:bg-purple-950/20",
    border: "border-purple-200 dark:border-purple-800",
    text: "text-purple-900 dark:text-purple-100",
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
  }
}

function getShiftTypeBadge(startTime: string): { label: string; variant: string } {
  const hour = parseInt(startTime.split(":")[0] || "0", 10)
  if (hour >= 7 && hour < 13) return { label: "Morning", variant: "amber" }
  if (hour >= 13 && hour < 18) return { label: "Afternoon", variant: "blue" }
  return { label: "Night", variant: "purple" }
}

export function MyShiftsCalendar({ systemUserId }: MyShiftsCalendarProps) {
  const [shifts, setShifts] = useState<AssignedShiftInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 100

  const api = getApiClient()

  useEffect(() => {
    loadShifts()
  }, [systemUserId, currentPage])

  async function loadShifts() {
    try {
      setLoading(true)
      const response = await api.getShiftAssignmentsByUser(systemUserId, {
        page: currentPage,
        limit,
      })
      setShifts(response.data)
      if (response.pagination) {
        setTotalPages(response.pagination.total_pages)
        setTotalCount(response.pagination.total_count)
      }
    } catch (error: any) {
      toast.error("Unable to load shifts: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  function getShiftsForDate(date: Date) {
    const dateStr = format(date, "yyyy-MM-dd")
    return shifts.filter((shift) => {
      try {
        const shiftDate = format(parseISO(shift.shift_date), "yyyy-MM-dd")
        return shiftDate === dateStr
      } catch {
        return false
      }
    })
  }

  function formatShiftTime(shift: AssignedShiftInfo) {
    return `${shift.start_time} - ${shift.end_time}`
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, any> = {
      active: "default",
      completed: "secondary",
      cancelled: "destructive",
    }
    return (
      <Badge variant={variants[status] || "outline"} className="text-xs">
        {status === "active" && "Active"}
        {status === "completed" && "Completed"}
        {status === "cancelled" && "Cancelled"}
        {!["active", "completed", "cancelled"].includes(status) && status}
      </Badge>
    )
  }

  
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(selectedWeekStart, i)
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            My Work Schedule
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-400"></div>
              <span>Morning Shift (7:00-13:00)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-400"></div>
              <span>Afternoon Shift (13:00-18:00)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-purple-400"></div>
              <span>Night Shift (18:00+)</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {shifts.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                You have not been assigned any shifts
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <button
                  onClick={() =>
                    setSelectedWeekStart(addDays(selectedWeekStart, -7))
                  }
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Previous Week
                </button>
                <div className="font-medium">
                  {format(selectedWeekStart, "dd/MM/yyyy", { locale: vi })} -{" "}
                  {format(addDays(selectedWeekStart, 6), "dd/MM/yyyy", {
                    locale: vi,
                  })}
                </div>
                <button
                  onClick={() =>
                    setSelectedWeekStart(addDays(selectedWeekStart, 7))
                  }
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Next Week →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {weekDays.map((day, index) => {
                  const dayShifts = getShiftsForDate(day)
                  const isToday = isSameDay(day, new Date())
                  return (
                    <div
                      key={index}
                      className={`border rounded-lg p-3 ${
                        isToday ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="text-center mb-2">
                        <div className="text-xs text-muted-foreground">
                          {format(day, "EEE", { locale: vi })}
                        </div>
                        <div
                          className={`text-lg font-semibold ${
                            isToday ? "text-primary" : ""
                          }`}
                        >
                          {format(day, "dd")}
                        </div>
                      </div>
                      {dayShifts.length > 0 ? (
                        <div className="space-y-2">
                          {dayShifts.map((shift) => {
                            const colors = getShiftTimeColor(shift.start_time)
                            const shiftType = getShiftTypeBadge(shift.start_time)
                            
                            return (
                              <div
                                key={shift._id}
                                className={`p-2 rounded-md border-l-4 text-xs space-y-1 transition-all hover:shadow-md ${colors.bg} ${colors.border}`}
                              >
                                <div className={`flex items-center gap-1 ${colors.text}`}>
                                  <Clock className="h-3 w-3" />
                                  <span className="font-medium">{formatShiftTime(shift)}</span>
                                </div>
                                <div className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${colors.badge}`}>
                                  {shiftType.label}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground text-center py-2">
                          No shifts available
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">
                  All Shifts ({totalCount})
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {shifts
                    .sort((a, b) => new Date(a.shift_date).getTime() - new Date(b.shift_date).getTime())
                    .map((shift) => {
                      const colors = getShiftTimeColor(shift.start_time)
                      const shiftType = getShiftTypeBadge(shift.start_time)
                      
                      return (
                        <div
                          key={shift._id}
                          className={`rounded-lg border-l-4 p-3 transition-all hover:shadow-md ${colors.bg} ${colors.border}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="font-medium flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {format(parseISO(shift.shift_date), "EEEE, dd/MM/yyyy", {
                                  locale: vi,
                                })}
                              </div>
                              <div className={`text-sm flex items-center gap-2 ${colors.text}`}>
                                <Clock className="h-4 w-4" />
                                {formatShiftTime(shift)}
                              </div>
                              <div className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${colors.badge}`}>
                                {shiftType.label}
                              </div>
                            </div>
                            {getStatusBadge(shift.status)}
                          </div>
                        </div>
                      )
                    })}
                </div>
                {totalPages > 1 && (
                  <div className="mt-4">
                    <DataPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
