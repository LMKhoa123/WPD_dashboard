"use client"

import React, { useCallback, useMemo, useState } from "react"
import "antd/dist/reset.css"
import { Layout, Card as AntCard, Modal, Select as AntSelect, Tag, Avatar as AntAvatar, Typography, Space, DatePicker, TimePicker, Form } from "antd"
import { useDroppable, useDraggable, DndContext, DragEndEvent, DragOverlay, closestCenter } from "@dnd-kit/core"
import dayjs from "dayjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { mockStaff } from "@/src/lib/mock-data"

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
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function getWeekRange(base: Date) {
  const day = base.getDay() || 7 // Monday as start
  const monday = new Date(base)
  monday.setDate(base.getDate() - (day - 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { monday, sunday }
}

function formatRange(monday: Date, sunday: Date) {
  const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" }
  return `${monday.toLocaleDateString(undefined, options)} – ${sunday.toLocaleDateString(undefined, options)}`
}

// DnD wrappers
function DraggableTech({ id, name }: { id: string; name: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `tech-${id}`, data: { type: "tech", technicianId: id } as TechDragData })
  const initials = name.split(" ").map(p => p[0]).slice(0,2).join("")
  return (
    <AntCard size="small" ref={setNodeRef as any} {...listeners} {...attributes} className={`mb-2 cursor-move ${isDragging ? "opacity-60" : ""}`}>
      <Space>
        <AntAvatar size={28}>{initials}</AntAvatar>
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
    <div ref={setNodeRef as any} className={`h-14 border-b border-r relative ${isOver ? "bg-blue-50" : ""}`}>
      {children}
    </div>
  )
}

export function ShiftScheduler() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const { monday, sunday } = useMemo(() => getWeekRange(currentWeek), [currentWeek])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [selectedTech, setSelectedTech] = useState<string | undefined>(undefined)
  const [skill, setSkill] = useState<string | undefined>(undefined)

  // Modal state
  const [editing, setEditing] = useState<{ visible: boolean; shift?: Shift }>({ visible: false })
  const [form] = Form.useForm()

  const onDragEnd = useCallback((e: DragEndEvent) => {
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
      const id = `shift-${Date.now()}`
      setShifts(prev => [...prev, { id, technicianId: techId, start, end: defaultEnd, status: "scheduled" }])
    } else if ((data as ShiftDragData).type === "shift") {
      const shiftId = (data as ShiftDragData).shiftId
      setShifts(prev => prev.map(s => {
        if (s.id !== shiftId) return s
        const durationMs = s.end.getTime() - s.start.getTime()
        const newEnd = new Date(start.getTime() + durationMs)
        return { ...s, start, end: newEnd }
      }))
    }
  }, [monday])

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

  // Filtering - basic demo
  const technicians = useMemo(() => mockStaff.filter(s => s.role === "Technician" && s.status === "Active"), [])
  const filteredTechs = useMemo(() => technicians.filter(t => !selectedTech || t.id === selectedTech), [technicians, selectedTech])

  // Rendering helpers
  function ShiftBlock({ s }: { s: Shift }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `shift-${s.id}`, data: { type: "shift", shiftId: s.id } as ShiftDragData })
    const tech = technicians.find(t => t.id === s.technicianId)
    const label = `${tech?.name ?? s.technicianId}`
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
      </div>
    )
  }

  return (
    <>
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Technician Shift Scheduler</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCurrentWeek(new Date(currentWeek.getTime() - 7*86400000))}>{"<"} Prev</Button>
          <div className="min-w-[220px] text-center text-sm">{formatRange(monday, sunday)}</div>
          <Button variant="outline" onClick={() => setCurrentWeek(new Date(currentWeek.getTime() + 7*86400000))}>Next {">"}</Button>
          <AntSelect
            style={{ width: 200 }}
            placeholder="Filter technician"
            allowClear
            value={selectedTech}
            onChange={(v: string | undefined) => setSelectedTech(v)}
            options={technicians.map(t => ({ value: t.id, label: t.name }))}
          />
          <AntSelect
            style={{ width: 160 }}
            placeholder="Filter skill"
            allowClear
            value={skill}
            onChange={(v: string | undefined) => setSkill(v)}
            options={[{ value: "general", label: "General" }]}
          />
          <Button variant="outline" onClick={addShiftManual}>Add Shift</Button>
          <Button variant="outline" onClick={autoAssign}>Auto Assign</Button>
          <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <Layout className="bg-transparent">
            <Sider width={260} className="bg-transparent pr-4">
              <AntCard title="Technicians" size="small">
                {filteredTechs.map(t => (
                  <DraggableTech key={t.id} id={t.id} name={t.name} />
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
          <DragOverlay />
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
          <AntSelect options={technicians.map(t => ({ value: t.id, label: t.name }))} />
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
