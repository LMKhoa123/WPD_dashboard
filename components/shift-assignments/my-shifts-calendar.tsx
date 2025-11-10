"use client"

import { useEffect, useState } from "react"
import { getApiClient, type AssignedShiftInfo } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { format, parseISO, startOfWeek, addDays, isSameDay } from "date-fns"
import { vi } from "date-fns/locale"

interface MyShiftsCalendarProps {
  systemUserId: string
}

export function MyShiftsCalendar({ systemUserId }: MyShiftsCalendarProps) {
  const [shifts, setShifts] = useState<AssignedShiftInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )

  const api = getApiClient()

  useEffect(() => {
    loadShifts()
  }, [systemUserId])

  async function loadShifts() {
    try {
      setLoading(true)
      const data = await api.getShiftAssignmentsByUser(systemUserId)
      setShifts(data)
    } catch (error: any) {
      toast.error("Không thể tải lịch làm việc: " + error.message)
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
        {status === "active" && "Hoạt động"}
        {status === "completed" && "Hoàn thành"}
        {status === "cancelled" && "Đã hủy"}
        {!["active", "completed", "cancelled"].includes(status) && status}
      </Badge>
    )
  }

  // Generate 7 days starting from selectedWeekStart
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
            Lịch làm việc của tôi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shifts.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Bạn chưa được phân công ca làm việc nào
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Week navigation */}
              <div className="flex items-center justify-between border-b pb-4">
                <button
                  onClick={() =>
                    setSelectedWeekStart(addDays(selectedWeekStart, -7))
                  }
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Tuần trước
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
                  Tuần sau →
                </button>
              </div>

              {/* Week calendar */}
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
                          {dayShifts.map((shift) => (
                            <div
                              key={shift._id}
                              className="bg-accent/50 p-2 rounded text-xs space-y-1"
                            >
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatShiftTime(shift)}</span>
                              </div>
                              {getStatusBadge(shift.status)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground text-center py-2">
                          Không có ca
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* All shifts list */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">
                  Tất cả ca làm việc ({shifts.length})
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {shifts.map((shift) => (
                    <div
                      key={shift._id}
                      className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(parseISO(shift.shift_date), "EEEE, dd/MM/yyyy", {
                              locale: vi,
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {formatShiftTime(shift)}
                          </div>
                        </div>
                        {getStatusBadge(shift.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
