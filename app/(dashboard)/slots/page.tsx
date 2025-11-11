"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { getApiClient, type SlotRecord, type CenterRecord } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Eye, RefreshCw, CalendarClock, Workflow } from "lucide-react"
import { toast } from "sonner"
import { AdminOnly } from "@/components/role-guards"
import { SlotDetailDialog } from "@/components/slots/slot-detail-dialog"
import { GenerateSlotsDialog } from "@/components/staff/generate-slots-dialog"
import { WorkshiftSlotWizard } from "@/components/slots/workshift-slot-wizard"
import { formatDate, formatDateTime } from "@/lib/utils"

export default function SlotsManagementPage() {
  const [slots, setSlots] = useState<SlotRecord[]>([])
  const [centers, setCenters] = useState<CenterRecord[]>([])
  const [selectedCenter, setSelectedCenter] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<SlotRecord | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [generateSlotsOpen, setGenerateSlotsOpen] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)

  const api = useMemo(() => getApiClient(), [])

  const loadCenters = useCallback(async () => {
    try {
      const res = await api.getCenters()
      setCenters(res.data.centers)
      if (res.data.centers.length > 0) {
        setSelectedCenter(res.data.centers[0]._id)
      }
    } catch (e: any) {
      toast.error("Không thể tải danh sách trung tâm: " + (e?.message || "Unknown error"))
    }
  }, [api])

  const loadSlots = useCallback(async () => {
    if (!selectedCenter) return
    try {
      setLoading(true)
      const data = await api.getSlots(selectedCenter)
      setSlots(data)
    } catch (e: any) {
      toast.error("Không thể tải danh sách slots: " + (e?.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [api, selectedCenter])

  useEffect(() => {
    loadCenters()
  }, [loadCenters])

  useEffect(() => {
    if (selectedCenter) {
      loadSlots()
    }
  }, [selectedCenter, loadSlots])

  const handleViewDetail = (slot: SlotRecord) => {
    setSelectedSlot(slot)
    setDetailDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      active: { variant: "default", label: "Hoạt động" },
      inactive: { variant: "secondary", label: "Không hoạt động" },
      full: { variant: "destructive", label: "Đã đầy" },
    }
    const config = variants[status] || { variant: "outline", label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <AdminOnly>
      <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Quản lý Slots</h1>
              <p className="text-muted-foreground">Xem và quản lý các slot đặt lịch theo trung tâm</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setWizardOpen(true)} variant="default" size="sm">
                <Workflow className="mr-2 h-4 w-4" />
                Flow: Ca → Slots
              </Button>
              <Button onClick={() => setGenerateSlotsOpen(true)} variant="secondary" size="sm">
                <CalendarClock className="mr-2 h-4 w-4" />
                Generate Slots
              </Button>
              <Button onClick={loadSlots} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Làm mới
              </Button>
            </div>
          </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Danh sách Slots</CardTitle>
                <CardDescription>Chọn trung tâm để xem slots</CardDescription>
              </div>
              <div className="w-[300px]">
                <Select value={selectedCenter} onValueChange={setSelectedCenter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trung tâm" />
                  </SelectTrigger>
                  
                  <SelectContent>
                    {centers.map((center) => (
                      <SelectItem key={center._id} value={center._id}>
                        {center.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Không có slot nào cho trung tâm này
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Giờ bắt đầu</TableHead>
                    <TableHead>Giờ kết thúc</TableHead>
                    <TableHead className="text-center">Sức chứa</TableHead>
                    <TableHead className="text-center">Đã đặt</TableHead>
                    <TableHead className="text-center">Còn trống</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Cập nhật</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slots.map((slot) => {
                    const available = slot.capacity - slot.booked_count
                    return (
                      <TableRow key={slot._id}>
                        <TableCell className="font-medium">
                          {formatDate(slot.slot_date)}
                        </TableCell>
                        <TableCell>{slot.start_time}</TableCell>
                        <TableCell>{slot.end_time}</TableCell>
                        <TableCell className="text-center">{slot.capacity}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={slot.booked_count > 0 ? "default" : "outline"}>
                            {slot.booked_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={available > 0 ? "secondary" : "destructive"}>
                            {available}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(slot.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {slot.updatedAt ? formatDateTime(slot.updatedAt) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetail(slot)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {selectedSlot && (
          <SlotDetailDialog
            slot={selectedSlot}
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
          />
        )}

        <GenerateSlotsDialog
          open={generateSlotsOpen}
          onOpenChange={setGenerateSlotsOpen}
          centers={centers}
          onSuccess={loadSlots}
        />

        <WorkshiftSlotWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          centers={centers}
          onCompleted={loadSlots}
        />
      </div>
    </AdminOnly>
  )
}
