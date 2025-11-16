"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { format, parseISO, startOfWeek, addDays, isSameDay } from "date-fns"
import { vi } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { getApiClient, type AssignedShiftInfo } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface MyShiftsCalendarProps {
  systemUserId: string
}

// Color logic based on shift time
function getShiftTimeColor(startTime: string): { bg: string; border: string; text: string; badge: string } {
  const hour = parseInt(startTime.split(":")[0] || "0", 10)
  
  // Morning shift (7:00 - 13:00)
  if (hour >= 7 && hour < 13) {
    return {
      bg: "bg-amber-50 dark:bg-amber-950/20",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-900 dark:text-amber-100",
      badge: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
    }
  }
  
  // Afternoon shift (13:00 - 18:00)
  if (hour >= 13 && hour < 18) {
    return {
      bg: "bg-blue-50 dark:bg-blue-950/20",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-900 dark:text-blue-100",
      badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
    }
  }
  
  // Night shift (18:00+)
  return {
    bg: "bg-purple-50 dark:bg-purple-950/20",
    border: "border-purple-200 dark:border-purple-800",
    text: "text-purple-900 dark:text-purple-100",
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
  }
}

function getShiftTypeBadge(startTime: string): { label: string; variant: string } {
  const hour = parseInt(startTime.split(":")[0] || "0", 10)
  if (hour >= 7 && hour < 13) return { label: "Morning Shift", variant: "amber" }
  if (hour >= 13 && hour < 18) return { label: "Afternoon Shift", variant: "blue" }
  return { label: "Night Shift", variant: "purple" }
}

export function MyShiftsCalendar({ systemUserId }: MyShiftsCalendarProps) {
  const api = useMemo(() => getApiClient(), [])
  const { toast } = useToast()
  const [shifts, setShifts] = useState<AssignedShiftInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )

  const loadShifts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getShiftAssignmentsByUser(systemUserId)
      setShifts(res)
    } catch (e: any) {
      toast({
        title: "Failed to load shifts",
        description: e?.message || "Failed to load shifts",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [api, systemUserId, toast])

  useEffect(() => {
    loadShifts()
  }, [loadShifts])

  // Get shifts for a specific date
  const getShiftsForDate = (date: Date) => {
    return shifts.filter(shift => {
      const shiftDate = parseISO(shift.shift_date)
      return isSameDay(date, shiftDate)
    })
  }

  // Format shift time display
  const formatShiftTime = (shift: AssignedShiftInfo) => {
    return `${shift.start_time} - ${shift.end_time}`
  }

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "completed":
        return "secondary"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Week navigation
  const goToPreviousWeek = () => {
    setSelectedWeekStart(prev => addDays(prev, -7))
  }

  const goToNextWeek = () => {
    setSelectedWeekStart(prev => addDays(prev, 7))
  }

  const goToToday = () => {
    setSelectedWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  // Generate week days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(selectedWeekStart, i))
  }, [selectedWeekStart])

  const today = new Date()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Work Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Spinner /> Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>My Work Schedule</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
      <CardContent className="space-y-6">
        {/* Week view */}
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-3">
            {format(weekDays[0], "d MMM", { locale: vi })} - {format(weekDays[6], "d MMM yyyy", { locale: vi })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
            {weekDays.map((date) => {
              const dayShifts = getShiftsForDate(date)
              const isToday = isSameDay(date, today)
              
              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    "border rounded-lg p-3 min-h-[120px]",
                    isToday && "border-primary bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-2",
                    isToday && "text-primary"
                  )}>
                    {format(date, "EEE", { locale: vi })}
                    <div className="text-lg">{format(date, "d")}</div>
                  </div>
                  
                  {dayShifts.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No shifts</div>
                  ) : (
                    <div className="space-y-2">
                      {dayShifts.map((shift) => {
                        const colors = getShiftTimeColor(shift.start_time)
                        const shiftType = getShiftTypeBadge(shift.start_time)
                        
                        return (
                          <div
                            key={shift._id}
                            className={cn(
                              "p-2 rounded-md border-l-4 text-xs space-y-1 transition-all hover:shadow-md",
                              colors.bg,
                              colors.border
                            )}
                          >
                            <div className={cn("font-medium", colors.text)}>
                              {formatShiftTime(shift)}
                            </div>
                            <div className={cn("inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium", colors.badge)}>
                              {shiftType.label}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* All shifts list */}
        {shifts.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-3">All Shifts</div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {shifts
                .sort((a, b) => new Date(a.shift_date).getTime() - new Date(b.shift_date).getTime())
                .map((shift) => {
                  const colors = getShiftTimeColor(shift.start_time)
                  const shiftType = getShiftTypeBadge(shift.start_time)
                  
                  return (
                    <div
                      key={shift._id}
                      className={cn(
                        "p-3 rounded-lg border-l-4 transition-all hover:shadow-md",
                        colors.bg,
                        colors.border
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {format(parseISO(shift.shift_date), "EEE, dd MMM yyyy", { locale: vi })}
                            </span>
                            <div className={cn("inline-flex px-2 py-0.5 rounded text-xs font-medium", colors.badge)}>
                              {shiftType.label}
                            </div>
                          </div>
                          <div className={cn("text-sm flex items-center gap-2", colors.text)}>
                            <Clock className="h-4 w-4" />
                            {formatShiftTime(shift)}
                          </div>
                        </div>
                        <Badge variant={getStatusBadge(shift.status)}>
                          {shift.status}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
