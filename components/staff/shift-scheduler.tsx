"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import "antd/dist/reset.css"
import { Layout, Card as AntCard, Modal, Select as AntSelect, Tag, Avatar as AntAvatar, Typography, Space, DatePicker, TimePicker, Form } from "antd"
import { useDroppable, useDraggable, DndContext, DragEndEvent, DragOverlay, closestCenter } from "@dnd-kit/core"
import dayjs from "dayjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { mockStaff } from "@/src/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import { getApiClient, type UserAccount, type WorkshiftRecord, type ShiftAssignmentRecord } from "@/lib/api"
import WorkshiftDialog from "./workshift-dialog"

const { Sider, Content } = Layout
const { Title, Text } = Typography

// Types
type StatusType = "scheduled" | "in-progress" | "completed" | "cancelled"
const STATUS_ORDER: StatusType[] = ["scheduled", "in-progress", "completed", "cancelled"]
const statusConfig: Record<StatusType, { label: string; color: string }> = {
  "scheduled": { label: "Scheduled", color: "blue" },
  "in-progress": { label: "In Progress", color: "orange" },
  "completed": { label: "Completed", color: "green" },
  "cancelled": { label: "Cancelled", color: "default" },
}

function normalizeStatus(s?: string): StatusType {
  const k = (s || "scheduled").toLowerCase().replace(/\s+/g, "-") as StatusType
  return (STATUS_ORDER as string[]).includes(k) ? (k as StatusType) : "scheduled"
}

type Shift = {
  id: string
  technicianId: string
  start: Date
  end: Date
  status: StatusType
}

type TechDragData = { type: "tech"; technicianId: string }
type ShiftDragData = { type: "shift"; shiftId: string }

// Helpers
const hours = Array.from({ length: 13 }, (_, i) => 8 + i) // 8..20

function getWeekRange(date: Date) {
  const d = new Date(date)
  const day = d.getDay() || 7 // Monday as 1.. Sunday: 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - (day - 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

function formatRange(monday: Date, sunday: Date) {
  const fmt = (dt: Date) => dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

function DraggableTech({ id, name }: { id: string; name: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `tech-${id}`, data: { type: "tech", technicianId: id } as TechDragData })
  return (
    <AntCard
      ref={setNodeRef as any}
      size="small"
      className={`mb-2 cursor-move ${isDragging ? "opacity-60" : ""}`}
      {...listeners}
      {...attributes}
    >
      <Space>
        <AntAvatar size="small">{name?.[0]?.toUpperCase() || "T"}</AntAvatar>
        <div>
          <div className="font-medium leading-none">{name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>General</Text>
        </div>
        <Tag color="blue" style={{ marginLeft: "auto" }}>Tech</Tag>
      </Space>
    </AntCard>
  )
}

function DroppableCell({ id, children }: { id: string; children?: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef as any} className={`h-14 border-b ${isOver ? "bg-blue-50/60" : ""}`}>
      {children}
    </div>
  )
}

export function ShiftScheduler() {
  const { toast } = useToast()
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const { monday, sunday } = useMemo(() => getWeekRange(currentWeek), [currentWeek])
  const [shifts, setShifts] = useState<Shift[]>([])
  // backend data
  const [workshifts, setWorkshifts] = useState<WorkshiftRecord[]>([])
  // map: workshiftId -> list of { system_user_id, optional _id }
  const [assignmentsMap, setAssignmentsMap] = useState<Record<string, Array<{ system_user_id: string; _id?: string }>>>({})
  const [technicians, setTechnicians] = useState<UserAccount[]>([])
  const [selectedTech, setSelectedTech] = useState<string | undefined>(undefined)
  const [skill, setSkill] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createSeed, setCreateSeed] = useState<{ shiftId?: string; date?: string; start?: string; end?: string } | null>(null)

  // Modal state
  const [editing, setEditing] = useState<{ visible: boolean; shift?: Shift }>({ visible: false })
  const [form] = Form.useForm()

  // load technicians and week workshifts + assignments
  const load = useCallback(async () => {
      try {
        setLoading(true)
        const api = getApiClient()
        const [users, ws] = await Promise.all([
          api.getUsers({ role: "TECHNICIAN", page: 1, limit: 200 }),
          api.getWorkshifts(),
        ])
        setTechnicians(users)
        const start = new Date(monday); const end = new Date(sunday); end.setHours(23,59,59,999)
        const inWeek = ws.filter(w => {
          const d = new Date(w.shift_date)
          return d >= start && d <= end
        })
        setWorkshifts(inWeek)
  const assigns = await Promise.all(inWeek.map(w => api.getShiftAssignmentsByShift(w.shift_id).catch(() => [] as string[])))
  const map: Record<string, Array<{ system_user_id: string; _id?: string }>> = {}
  inWeek.forEach((w, i) => { map[w._id] = (assigns[i] as string[]).map(uid => ({ system_user_id: uid })) })
        setAssignmentsMap(map)
      } catch (e: any) {
        toast({ title: "Lỗi tải dữ liệu", description: e?.message || "Failed to load shifts/technicians", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }, [monday, sunday, toast])

  useEffect(() => { load() }, [load])

  const findMatchingWorkshift = useCallback((dayIdx: number, hour: number): WorkshiftRecord | null => {
    const date = new Date(monday); date.setDate(monday.getDate() + dayIdx)
    const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2, "0"), d = String(date.getDate()).padStart(2, "0")
    const key = `${y}-${m}-${d}`
    const candidates = workshifts.filter(w => w.shift_date.startsWith(key))
    const toMinutes = (hhmm: string) => { const [hh, mm] = hhmm.split(":").map(Number); return hh*60 + (mm||0) }
    const cellMin = hour*60
    return candidates.find(w => {
      const st = toMinutes(w.start_time)
      const en = toMinutes(w.end_time)
      return cellMin >= st && cellMin < en
    }) || null
  }, [monday, workshifts])

  const onDragEnd = useCallback(async (e: DragEndEvent) => {
    const active = e.active
    const over = e.over
    if (!over) return
    const overId = String(over.id)
    if (!overId.startsWith("cell-")) return
    const [, dayStr, hourStr] = overId.split("-")
    const dayIdx = parseInt(dayStr, 10)
    const hour = parseInt(hourStr, 10)

    const start = new Date(monday)
    start.setDate(monday.getDate() + dayIdx)
    start.setHours(hour, 0, 0, 0)

    // default 1 hour duration
    const defaultEnd = new Date(start)
    defaultEnd.setHours(start.getHours() + 1)

    const data = active.data.current as TechDragData | ShiftDragData
    if ((data as TechDragData).type === "tech") {
      const techId = (data as TechDragData).technicianId
      const ws = findMatchingWorkshift(dayIdx, hour)
      if (!ws) {
        // Suggest quick create of a workshift at this slot
        const date = new Date(monday); date.setDate(monday.getDate() + dayIdx)
        const yyyy = date.getFullYear(); const mm = String(date.getMonth()+1).padStart(2,"0"); const dd = String(date.getDate()).padStart(2,"0")
        const shiftId = `shift-${yyyy}-${mm}-${dd}-${String(hour).padStart(2,"0")}`
        setCreateSeed({ shiftId, date: `${yyyy}-${mm}-${dd}`, start: `${String(hour).padStart(2,"0")}:00`, end: `${String(hour+1).padStart(2,"0")}:00` })
        setCreateOpen(true)
        return
      }
      try {
  const created = await getApiClient().assignShifts({ system_user_id: techId, shift_ids: [ws.shift_id] })
        toast({ title: "Đã phân công", description: `Gán thành công vào ca ${ws.shift_id}` })
        setAssignmentsMap(prev => {
          const cur = prev[ws._id] || []
          const add = created.map(a => ({ system_user_id: (a.system_user_id as any) ?? techId, _id: a._id }))
          return { ...prev, [ws._id]: [...cur, ...add] }
        })
      } catch (err: any) {
        toast({ title: "Phân công thất bại", description: err?.message || "Error", variant: "destructive" })
      }
    } else if ((data as ShiftDragData).type === "shift") {
      const shiftId = (data as ShiftDragData).shiftId
      setShifts(prev => prev.map(s => {
        if (s.id !== shiftId) return s
        const durationMs = s.end.getTime() - s.start.getTime()
        const newEnd = new Date(start.getTime() + durationMs)
        return { ...s, start, end: newEnd }
      }))
    }
  }, [monday, findMatchingWorkshift, toast])

  const hoursLabels = useMemo(() => hours.map(h => `${h}:00`), [])

  const openEdit = useCallback((shift: Shift) => setEditing({ visible: true, shift }), [])
  const closeEdit = useCallback(() => setEditing({ visible: false, shift: undefined }), [])

  const updateShift = useCallback((values: any) => {
    if (!editing.shift) return
    const { technicianId, status, date, startTime, endTime } = values
    const base = (date ? date.toDate() : editing.shift.start)
    const start = new Date(base)
    const end = new Date(base)
    const st = startTime || dayjs(editing.shift.start)
    const et = endTime || dayjs(editing.shift.end)
    start.setHours(st.hour(), st.minute(), 0, 0)
    end.setHours(et.hour(), et.minute(), 0, 0)
    setShifts(prev => prev.map(s => s.id === editing.shift!.id ? { ...s, technicianId, status, start, end } : s))
    closeEdit()
  }, [editing, closeEdit])

  const removeShift = useCallback((id: string) => setShifts(prev => prev.filter(s => s.id !== id)), [])

  const addShiftManual = useCallback(() => {
    if (!mockStaff.length) return
    const techId = mockStaff[0].id
    const start = new Date(monday)
    start.setHours(9,0,0,0)
    const end = new Date(start)
    end.setHours(11,0,0,0)
    setShifts(prev => [...prev, { id: `shift-${Date.now()}`, technicianId: techId, start, end, status: "scheduled" }])
  }, [monday])

  const autoAssign = useCallback(() => {
    // very simple auto-assign: create one morning shift for each tech on Monday
    const base = new Date(monday)
    const newShifts: Shift[] = []
    mockStaff.filter(s => s.role === "Technician" && s.status === "Active").forEach((t, idx) => {
      const st = new Date(base)
      st.setHours(9 + (idx%3)*2, 0, 0, 0)
      const en = new Date(st)
      en.setHours(st.getHours() + 2)
      newShifts.push({ id: `shift-${Date.now()}-${idx}` , technicianId: t.id, start: st, end: en, status: "scheduled" })
    })
    setShifts(prev => [...prev, ...newShifts])
  }, [monday])

  const exportCsv = useCallback(() => {
    const rows = [
      ["ID", "Technician", "Start", "End", "Status"],
      ...shifts.map(s => [s.id, s.technicianId, s.start.toISOString(), s.end.toISOString(), s.status])
    ]
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `shifts-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [shifts])

  // Filtering - from backend technicians state
  const filteredTechs = useMemo(() => technicians.filter(t => !selectedTech || t._id === selectedTech), [technicians, selectedTech])

  // Rendering helpers
  function ShiftBlock({ s }: { s: Shift }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `shift-${s.id}`, data: { type: "shift", shiftId: s.id } as ShiftDragData })
  const tech = technicians.find(t => t._id === s.technicianId)
  const label = `${tech?.email ?? s.technicianId}`
    const durHrs = (s.end.getTime() - s.start.getTime()) / 3600000
    return (
      <div
        ref={setNodeRef as any}
        {...listeners}
        {...attributes}
        className={`absolute left-1 right-1 rounded border bg-white shadow-sm p-1 cursor-move ${isDragging ? "opacity-60" : ""}`}
        style={{ top: `${(s.start.getHours() - 8) * 56}px`, height: `${Math.max(durHrs, 1) * 56 - 4}px` }}
        onDoubleClick={() => openEdit(s)}
      >
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium truncate">{label}</span>
          <Tag color={statusConfig[s.status].color} style={{ marginInlineStart: "auto" }}>{statusConfig[s.status].label}</Tag>
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500">
          <span>{`${s.start.getHours()}:00–${s.end.getHours()}:00`}</span>
          <div className="space-x-1">
            <button className="px-1 border rounded" onClick={(e) => { e.stopPropagation(); setShifts(prev=>prev.map(x=> x.id===s.id ? { ...x, end: new Date(Math.max(x.start.getTime()+3600000, x.end.getTime()-3600000)) } : x)) }}>-1h</button>
            <button className="px-1 border rounded" onClick={(e) => { e.stopPropagation(); setShifts(prev=>prev.map(x=> x.id===s.id ? { ...x, end: new Date(x.end.getTime()+3600000) } : x)) }}>+1h</button>
            <button className="px-1 border rounded" onClick={(e) => { e.stopPropagation(); removeShift(s.id) }}>Del</button>
          </div>
        </div>
      </div>
    )
  }

  function DayColumn({ dayIndex }: { dayIndex: number }) {
    const dayDate = new Date(monday); dayDate.setDate(monday.getDate() + dayIndex)
    const dayShifts = shifts.filter(s => s.start.toDateString() === dayDate.toDateString())
    const yyyy = dayDate.getFullYear(); const mm = String(dayDate.getMonth()+1).padStart(2,"0"); const dd = String(dayDate.getDate()).padStart(2,"0")
    const dayWs = workshifts.filter(w => w.shift_date.startsWith(`${yyyy}-${mm}-${dd}`))
    const toMinutes = (hhmm: string) => { const [hh, mm2] = hhmm.split(":").map(Number); return (hh||0)*60 + (mm2||0) }
    return (
      <div className="relative">
        {/* grid cells */}
        {hours.map(h => (
          <DroppableCell key={`cell-${dayIndex}-${h}`} id={`cell-${dayIndex}-${h}`} />
        ))}
        {/* overlay shifts */}
        {dayShifts.map(s => (
          <ShiftBlock key={s.id} s={s} />
        ))}
        {/* overlay backend workshifts with assignments */}
        {dayWs.map(w => {
          const stMin = toMinutes(w.start_time)
          const enMin = toMinutes(w.end_time)
          const topPx = (stMin/60 - 8) * 56
          const heightPx = Math.max(1, (enMin-stMin)/60) * 56 - 4
          const assigns = assignmentsMap[w._id] || []
          return (
            <div key={w._id} className="absolute left-1 right-1 rounded border border-dashed bg-blue-50/50 p-1"
                 style={{ top: `${topPx}px`, height: `${heightPx}px` }}>
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <span className="font-medium truncate">{w.shift_id}</span>
                <span className="opacity-70">{w.start_time}-{w.end_time}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {assigns.map(a => {
                  const id = a.system_user_id
                  const name = technicians.find(t=>t._id===id)?.email || id
                  return (
                    <span key={a._id || id} className="inline-flex items-center gap-1 rounded border bg-white px-1 text-[10px]">
                      {name}
                      {a._id ? (
                        <button className="text-red-500" title="Remove" onClick={async (ev) => {
                          ev.stopPropagation()
                          try {
                            await getApiClient().deleteShiftAssignment(a._id!)
                            const users = await getApiClient().getShiftAssignmentsByShift(w.shift_id)
                            setAssignmentsMap(prev=>({ ...prev, [w._id]: (users as string[]).map(uid => ({ system_user_id: uid })) }))
                          } catch (err: any) {
                            toast({ title: "Xóa phân công thất bại", description: err?.message || "Error", variant: "destructive" })
                          }
                        }}>×</button>
                      ) : null}
                    </span>
                  )
                })}
                {assigns.length === 0 && (
                  <span className="text-[10px] text-muted-foreground">Chưa có phân công</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const days = useMemo(() => {
    const d: string[] = []
    for (let i = 0; i < 7; i++) {
      const dt = new Date(monday); dt.setDate(monday.getDate() + i)
      d.push(dt.toLocaleDateString(undefined, { weekday: "short", month: "numeric", day: "numeric" }))
    }
    return d
  }, [monday])

  return (
    <>
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Technician Shift Scheduler</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCurrentWeek(new Date(currentWeek.getTime() - 7*86400000))}>{"<"} Prev</Button>
          <div className="min-w-[220px] text-center text-sm">{formatRange(monday, sunday)}</div>
          <Button variant="outline" onClick={() => setCurrentWeek(new Date(currentWeek.getTime() + 7*86400000))}>Next {">"}</Button>
          <Button variant="outline" onClick={load} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</Button>
          <AntSelect
            style={{ width: 200 }}
            placeholder="Filter technician"
            allowClear
            value={selectedTech}
            onChange={(v: string | undefined) => setSelectedTech(v)}
            options={technicians.map(t => ({ value: t._id, label: t.email || t._id }))}
          />
          <AntSelect
            style={{ width: 160 }}
            placeholder="Filter skill"
            allowClear
            value={skill}
            onChange={(v: string | undefined) => setSkill(v)}
            options={[{ value: "general", label: "General" }]}
          />
          <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <Layout className="bg-transparent">
            <Sider width={260} className="bg-transparent pr-4">
              <AntCard title="Technicians" size="small">
                {filteredTechs.map(t => (
                  <DraggableTech key={t._id} id={t._id} name={t.email || t._id} />
                ))}
              </AntCard>
              <div className="mt-4">
                <Title level={5}>Legend</Title>
                <Space wrap size={[8,8]}>
                  {STATUS_ORDER.map(s => (
                    <Tag key={s} color={statusConfig[s].color}>{statusConfig[s].label}</Tag>
                  ))}
                </Space>
              </div>
            </Sider>
            <Content>
              <div className="grid" style={{ gridTemplateColumns: "60px repeat(7, minmax(0, 1fr))" }}>
                {/* header */}
                <div className="border-b" />
                {days.map((d, i) => (
                  <div key={i} className="border-b py-2 text-center font-medium">{d}</div>
                ))}
                {/* body */}
                <div className="flex flex-col">
                  {hoursLabels.map((h, i) => (
                    <div key={i} className="h-14 border-b pl-2 text-xs text-muted-foreground flex items-start pt-1">{h}</div>
                  ))}
                </div>
                {days.map((_, i) => (
                  <DayColumn key={i} dayIndex={i} />
                ))}
              </div>
            </Content>
          </Layout>
          </DndContext>
      </CardContent>
    </Card>
    {/* Edit Modal */}
    <Modal
      title="Edit Shift"
      open={editing.visible}
      onCancel={closeEdit}
      onOk={() => form.submit()}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={editing.shift ? {
          technicianId: editing.shift.technicianId,
          status: editing.shift.status,
          date: dayjs(editing.shift.start),
          startTime: dayjs(editing.shift.start),
          endTime: dayjs(editing.shift.end),
        } : undefined}
        onFinish={updateShift}
      >
        <Form.Item label="Technician" name="technicianId" rules={[{ required: true }] }>
          <AntSelect options={technicians.map(t => ({ value: t._id, label: t.email || t._id }))} />
        </Form.Item>
        <Form.Item label="Status" name="status" rules={[{ required: true }] }>
          <AntSelect options={STATUS_ORDER.map(s => ({ value: s, label: statusConfig[s].label }))} />
        </Form.Item>
        <Form.Item label="Date" name="date" rules={[{ required: true }]}>
          <DatePicker className="w-full" />
        </Form.Item>
        <div className="grid grid-cols-2 gap-2">
          <Form.Item label="Start" name="startTime" rules={[{ required: true }] }>
            <TimePicker className="w-full" minuteStep={15} format="HH:mm" />
          </Form.Item>
          <Form.Item label="End" name="endTime" rules={[{ required: true }] }>
            <TimePicker className="w-full" minuteStep={15} format="HH:mm" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
    </>
  )

}

export default ShiftScheduler
