"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Calendar, Views, type DateLocalizer, dateFnsLocalizer } from "react-big-calendar"
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "react-big-calendar/lib/addons/dragAndDrop/styles.css"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { addHours, format, isBefore, startOfWeek, parse, getDay } from "date-fns"
import { toast } from "sonner"
import { enUS } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { mockAppointments, mockStaff } from "@/src/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useIsAdmin } from "@/components/auth-provider"

const locales = { "en-US": enUS }
const localizer: DateLocalizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

type StatusType = "scheduled" | "in-progress" | "completed" | "cancelled"

const STATUS_ORDER: StatusType[] = ["scheduled", "in-progress", "completed", "cancelled"]
const statusConfig: Record<StatusType, { label: string; className: string }> = {
  "scheduled": { label: "Scheduled", className: "bg-blue-500/10 border-blue-500 text-blue-700" },
  "in-progress": { label: "In Progress", className: "bg-amber-500/20 border-amber-500 text-amber-700" },
  "completed": { label: "Completed", className: "bg-green-500/20 border-green-500 text-green-700" },
  "cancelled": { label: "Cancelled", className: "bg-gray-500/20 border-gray-500 text-gray-700" },
}

function normalizeStatus(s?: string): StatusType {
  const k = (s || "scheduled").toLowerCase().replace(/\s+/g, "-") as StatusType
  return (STATUS_ORDER as string[]).includes(k) ? (k as StatusType) : "scheduled"
}

type Event = {
  id: string
  title: string
  start: Date
  end: Date
  technicianId: string
  status?: StatusType
}

const technicians = mockStaff.filter((s) => s.role === "Technician" && s.status === "Active")

function buildInitialEvents(): Event[] {
  return mockAppointments.map((a) => {
    const tech = mockStaff.find((s) => s.name === a.technician)
    return {
      id: a.id,
      title: `${a.service} • ${a.vehicleName}`,
      start: a.startTime,
      end: a.endTime,
      technicianId: tech?.id || technicians[0]?.id || "",
      status: normalizeStatus(a.status as any),
    }
  })
}

export function AdvancedScheduler() {
  // === hooks: luôn khai báo trước bất kỳ return condition nào ===
  const isAdmin = useIsAdmin()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [events, setEvents] = useState<Event[]>(buildInitialEvents())
  // sửa kiểu view
  const [view, setView] = useState<"week" | "day">(Views.WEEK as "week")
  const [selectedTech, setSelectedTech] = useState<string>("all")
  const [filterText, setFilterText] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusType[]>([...STATUS_ORDER])
  // drag state for external DnD (drag technician into calendar)
  const [draggedTechId, setDraggedTechId] = useState<string | null>(null)

  const DnDCalendar = useMemo(() => withDragAndDrop(Calendar as any), [])

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const byTech = selectedTech === "all" || e.technicianId === selectedTech
      const byText = filterText
        ? e.title.toLowerCase().includes(filterText.toLowerCase()) || (e.status || "").toLowerCase().includes(filterText.toLowerCase())
        : true
      const byStatus = e.status ? statusFilter.includes(e.status) : statusFilter.includes("scheduled")
      return byTech && byText && byStatus
    })
  }, [events, selectedTech, filterText, statusFilter])

  const overlaps = useCallback((candidate: { start: Date; end: Date; technicianId: string; id?: string }) => {
    return events.some((e) => {
      if (candidate.id && e.id === candidate.id) return false
      if (e.technicianId !== candidate.technicianId) return false
      return candidate.start < e.end && candidate.end > e.start
    })
  }, [events])

  const onEventResize = useCallback(({ event, start, end }: any) => {
    const c = { id: event.id, start, end, technicianId: event.technicianId }
    if (overlaps(c)) {
      toast.error("Overlap detected for this technician")
      return
    }
    setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, start, end } : e)))
  }, [overlaps])

  const onEventDrop = useCallback(({ event, start, end, isAllDay, resourceId }: any) => {
    if (isBefore(start, new Date())) {
      toast.error("Cannot move event to the past")
      return
    }
    const techId = (resourceId as string | undefined) || event.technicianId
    const c = { id: event.id, start, end, technicianId: techId }
    if (overlaps(c)) {
      toast.error("Overlap detected for this technician")
      return
    }
    setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, start, end, technicianId: techId } : e)))
  }, [overlaps])

  // no resource columns -> single calendar to avoid over-wide layout

  const eventPropGetter = useCallback((event: Event) => {
    const conf = statusConfig[event.status || "scheduled"]
    const isPast = event.end < new Date()
    return { className: `border ${conf.className} ${isPast ? "opacity-70" : ""}` }
  }, [])

  const addQuickEvent = useCallback(() => {
    // tạo thời điểm bắt đầu ổn định: luôn dùng giờ gần nhất => tính khi hàm được gọi (client)
    const now = new Date()
    const startHour = new Date(now)
    // nếu hiện tại chưa tới phút 0, set tới giờ tiếp theo
    startHour.setMinutes(0, 0, 0)
    startHour.setHours(now.getHours() + 1)
    const end = addHours(startHour, 1)
    const id = `new_${Date.now()}`
    const tid = technicians[0]?.id || ""
    setEvents((prev) => [
      ...prev,
      { id, title: "Quick slot", start: startHour, end, technicianId: tid, resourceId: tid },
    ])
  }, [])

  const exportCsv = useCallback(() => {
    const rows = [
      ["ID", "Title", "Start", "End", "Technician"],
      ...events.map((e) => [e.id, e.title, e.start.toISOString(), e.end.toISOString(), e.technicianId]),
    ]
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `schedule-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [events])

  // === NOW we can bail out of rendering until mounted (but hooks already declared) ===
  // compute values that depend on 'now' but keep hooks order consistent across renders
  const defaultDate = useMemo(() => new Date(), [])
  const scrollToTime = useMemo(() => {
    const t = new Date()
    t.setHours(8, 0, 0, 0)
    return t
  }, [])

  // quick status change handler
  const setEventStatus = useCallback((id: string, status: StatusType) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)))
  }, [])

  // custom event content with status dropdown (admin-only)
  const EventContent = useCallback((props: any) => {
    const e: Event = props.event
    const conf = statusConfig[e.status || "scheduled"]
    const time = `${format(e.start, "HH:mm")}–${format(e.end, "HH:mm")}`
    return (
      <div className="px-1.5 py-1 text-xs leading-tight">
        <div className="flex items-center justify-between gap-2">
          <div className="font-medium truncate" title={e.title}>{e.title}</div>
          {isAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`rounded border px-1 py-0.5 ${conf.className}`}>{statusConfig[e.status || "scheduled"].label}</button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {STATUS_ORDER.map((s) => (
                  <DropdownMenuItem key={s} onClick={() => setEventStatus(e.id, s)}>
                    {statusConfig[s].label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span className={`rounded border px-1 py-0.5 ${conf.className}`}>{conf.label}</span>
          )}
        </div>
        <div className="mt-0.5 text-[10px] opacity-80">{time}</div>
      </div>
    )
  }, [isAdmin, setEventStatus])

  // external "drag from list" integration for react-big-calendar
  const dragFromOutsideItem = useCallback(() => {
    if (!draggedTechId) return null
    // Return a lightweight placeholder so RBC shows a preview while dragging
    return { title: "New slot", technicianId: draggedTechId }
  }, [draggedTechId])

  const onDropFromOutside = useCallback(({ start, end, allDay }: any) => {
    if (!draggedTechId) return
    const now = new Date()
    if (isBefore(start, now)) {
      toast.error("Cannot create in the past")
      setDraggedTechId(null)
      return
    }
    // If end is not provided or equals start, default to 1 hour
    const _end = end && end > start ? end : addHours(start, 1)
    const id = `new_${Date.now()}`
    const candidate = { id, start, end: _end, technicianId: draggedTechId }
    if (overlaps(candidate)) {
      toast.error("Overlap detected for this technician")
      setDraggedTechId(null)
      return
    }
    setEvents((prev) => [
      ...prev,
      { id, title: "New Job", start, end: _end, technicianId: draggedTechId },
    ])
    setDraggedTechId(null)
  }, [draggedTechId, overlaps])

  const onDragOver = useCallback((ev: any) => {
    // Required so the browser allows dropping
    if (ev && ev.preventDefault) ev.preventDefault()
  }, [])

  if (!mounted) return null

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Advanced Scheduling (Drag & Drop)</CardTitle>
        <div className="flex gap-2 items-center">
          <Select value={selectedTech} onValueChange={setSelectedTech}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filter by technician" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Technicians</SelectItem>
              {technicians.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input className="w-[200px]" placeholder="Search title/status" value={filterText} onChange={(e) => setFilterText(e.target.value)} />
          <ToggleGroup type="multiple" value={statusFilter} onValueChange={(v) => v.length ? setStatusFilter(v as StatusType[]) : null} className="hidden md:flex">
            {STATUS_ORDER.map((s) => (
              <ToggleGroupItem key={s} value={s} className="text-xs">
                {statusConfig[s].label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button variant="outline" onClick={addQuickEvent}>Quick Slot</Button>
          <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
        </div>
      </CardHeader>
      <CardContent>
        <DndProvider backend={HTML5Backend}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: draggable technician list */}
            <aside className="lg:col-span-3">
              <div className="rounded border p-3 h-[70vh] flex flex-col bg-background">
                <div className="mb-2 text-sm font-medium">Technicians</div>
                <Input
                  placeholder="Search technicians"
                  className="mb-2"
                  onChange={() => {/* optional, lightweight future enhancement */}}
                />
                <div className="flex-1 overflow-auto space-y-2 pr-1">
                  {technicians.map((t) => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggedTechId(t.id)
                        // help native DnD visuals
                        try { e.dataTransfer?.setData("text/plain", t.id) } catch {}
                      }}
                      onDragEnd={() => setDraggedTechId(null)}
                      className="flex items-center justify-between rounded border px-2 py-1 hover:bg-muted cursor-grab active:cursor-grabbing"
                      title="Drag to calendar to create a slot"
                    >
                      <span className="truncate">{t.name}</span>
                      <Badge variant="secondary" className="ml-2">{t.role}</Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Drag a name onto the calendar to assign.
                </div>
              </div>
            </aside>

            {/* Right: calendar */}
            <div className="lg:col-span-9">
              <div className="h-[70vh] rounded border bg-background">
                <DnDCalendar
                  localizer={localizer}
                  events={filteredEvents}
                  startAccessor="start"
                  endAccessor="end"
                  views={[Views.DAY, Views.WEEK]}
                  view={view}
                  onView={(v: any) => setView(v as any)}
                  step={30}
                  timeslots={2}
                  defaultDate={defaultDate}
                  resizable={isAdmin}
                  draggableAccessor={() => isAdmin}
                  onEventDrop={onEventDrop}
                  onEventResize={onEventResize}
                  // External DnD hooks
                  onDropFromOutside={onDropFromOutside}
                  dragFromOutsideItem={dragFromOutsideItem}
                  onDragOver={onDragOver}
                  scrollToTime={scrollToTime}
                  tooltipAccessor={(e: Event) => `${e.title}\n${format(e.start, 'PPpp')} → ${format(e.end, 'PPpp')}`}
                  eventPropGetter={eventPropGetter}
                  components={{ event: EventContent as any }}
                />
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                <Badge>Drag to move</Badge>
                <Badge>Resize to adjust</Badge>
                <Badge>Drag a technician from the left to create</Badge>
                <span className="ml-2">Legend:</span>
                {STATUS_ORDER.map((s) => (
                  <span key={s} className={`rounded border px-1 py-0.5 ${statusConfig[s].className}`}>{statusConfig[s].label}</span>
                ))}
              </div>
            </div>
          </div>
        </DndProvider>
      </CardContent>
    </Card>
  )
}
