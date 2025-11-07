"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { AdminStaffTechnicianOnly } from "@/components/role-guards"
import { getApiClient, type ServiceRecordRecord } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, Clock, RefreshCw, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type ColKey = "pending" | "in-progress" | "completed" | "cancelled"

export default function ServiceStatusBoardPage() {
  const api = useMemo(() => getApiClient(), [])
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<ServiceRecordRecord[]>([])
  const [q, setQ] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getServiceRecords({ limit: 500 })
      setRecords(res.data.records)
    } catch (e: any) {
      toast({ title: "Không tải được hồ sơ dịch vụ", description: e?.message || "Failed to load records", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [api, toast])

  useEffect(() => { load() }, [load])

  const filtered = records.filter((r) => {
    const text = q.toLowerCase()
    if (!text) return true
    const apt = r.appointment_id && typeof r.appointment_id === 'object' ? r.appointment_id : null
    const vehicleName = apt && typeof apt.vehicle_id === 'object' ? (apt.vehicle_id.vehicleName || "") : ""
    const desc = r.description || ""
    return vehicleName.toLowerCase().includes(text) || desc.toLowerCase().includes(text)
  })

  const cols: Record<ColKey, ServiceRecordRecord[]> = useMemo(() => ({
    pending: filtered.filter((r) => r.status === "pending"),
    "in-progress": filtered.filter((r) => r.status === "in-progress"),
    completed: filtered.filter((r) => r.status === "completed"),
    cancelled: filtered.filter((r) => r.status === "cancelled"),
  }), [filtered])

  const statusBadge = (s: string) => {
    if (s === "completed") return <Badge className="bg-green-500/10 text-green-600">Completed</Badge>
    if (s === "in-progress") return <Badge className="bg-blue-500/10 text-blue-600">In Progress</Badge>
    if (s === "pending") return <Badge className="bg-amber-500/10 text-amber-600">Pending</Badge>
    return <Badge variant="secondary">{s}</Badge>
  }

  const move = async (id: string, to: ColKey) => {
    try {
      setUpdatingId(id)
      const next = await api.updateServiceRecord(id, { status: to })
      setRecords((prev) => prev.map((r) => (r._id === id ? next : r)))
    } catch (e: any) {
      toast({ title: "Cập nhật trạng thái thất bại", description: e?.message || "Failed to update", variant: "destructive" })
    } finally {
      setUpdatingId(null)
    }
  }

  const Col = ({ title, icon: Icon, items, actions }: { title: string; icon: any; items: ServiceRecordRecord[]; actions: (r: ServiceRecordRecord) => React.ReactNode }) => (
    <Card className="h-full">
      <CardHeader className="sticky top-0 bg-background z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <CardTitle className="text-sm">{title}</CardTitle>
          </div>
          <Badge variant="secondary">{items.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">No records</div>
        ) : (
          items.map((r) => {
            const apt = r.appointment_id && typeof r.appointment_id === 'object' ? r.appointment_id : null
            const vehicleName = apt && typeof apt.vehicle_id === 'object' ? (apt.vehicle_id.vehicleName || "Vehicle") : "Vehicle"
            const start = new Date(r.start_time).toLocaleString()
            const end = new Date(r.end_time).toLocaleString()
            return (
              <div key={r._id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{vehicleName}</div>
                  {statusBadge(r.status)}
                </div>
                <div className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.description || "No description"}</div>
                <div className="mt-2 text-xs text-muted-foreground">{start} → {end}</div>
                <div className="mt-3 flex gap-2">{actions(r)}</div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )

  return (
    <AdminStaffTechnicianOnly>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Service Status Board</h1>
            <p className="text-muted-foreground">Theo dõi tiến độ: chờ – đang làm – hoàn tất</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reload
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by vehicle or description..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Col title="Pending" icon={Clock} items={cols["pending"]} actions={(r) => (
            <>
              <Button size="sm" variant="outline" onClick={() => move(r._id, "in-progress")} disabled={updatingId === r._id}>Start</Button>
            </>
          )} />

          <Col title="In Progress" icon={AlertCircle} items={cols["in-progress"]} actions={(r) => (
            <>
              <Button size="sm" variant="secondary" onClick={() => move(r._id, "completed")} disabled={updatingId === r._id}><CheckCircle2 className="mr-2 h-4 w-4" /> Complete</Button>
            </>
          )} />

          <Col title="Completed" icon={CheckCircle2} items={cols["completed"]} actions={() => null} />

          <Col title="Cancelled" icon={Clock} items={cols["cancelled"]} actions={() => null} />
        </div>
      </div>
    </AdminStaffTechnicianOnly>
  )
}
