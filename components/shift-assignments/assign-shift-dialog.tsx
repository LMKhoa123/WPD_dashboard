"use client"

import { useState, useMemo } from "react"
import { getApiClient } from "@/lib/api"
import type {
  WorkshiftRecord,
  SystemUserRecord,
  CenterRecord,
} from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import { Loader2, Users, UserCog } from "lucide-react"

interface AssignShiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  workshifts: WorkshiftRecord[]
  systemUsers: SystemUserRecord[]
  centers: CenterRecord[]
}

export function AssignShiftDialog({
  open,
  onOpenChange,
  onSuccess,
  workshifts,
  systemUsers,
  centers,
}: AssignShiftDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedWorkshiftIds, setSelectedWorkshiftIds] = useState<string[]>([])
  const [selectedCenter, setSelectedCenter] = useState<string>("all")
  const [submitting, setSubmitting] = useState(false)

  const api = getApiClient()

  // Phân loại system users thành Staff và Technician
  const staffUsers = useMemo(() => {
    return systemUsers.filter((user) => {
      const role =
        typeof user.userId === "object" ? user.userId.role : undefined
      return role === "STAFF"
    })
  }, [systemUsers])

  const technicianUsers = useMemo(() => {
    return systemUsers.filter((user) => {
      const role =
        typeof user.userId === "object" ? user.userId.role : undefined
      return role === "TECHNICIAN"
    })
  }, [systemUsers])

  // Filter workshifts by selected center
  const filteredWorkshifts = useMemo(() => {
    if (selectedCenter === "all") return workshifts
    return workshifts.filter((ws) => ws.center_id === selectedCenter)
  }, [workshifts, selectedCenter])

  function resetForm() {
    setSelectedUserId("")
    setSelectedWorkshiftIds([])
    setSelectedCenter("all")
  }

  function toggleWorkshift(workshiftId: string) {
    setSelectedWorkshiftIds((prev) =>
      prev.includes(workshiftId)
        ? prev.filter((id) => id !== workshiftId)
        : [...prev, workshiftId]
    )
  }

  function getCenterName(centerId: string) {
    return centers.find((c) => c._id === centerId)?.name || centerId
  }

  function formatShiftDate(dateStr: string) {
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy (EEE)", { locale: vi })
    } catch {
      return dateStr
    }
  }

  async function handleSubmit() {
    if (!selectedUserId) {
      toast.error("Vui lòng chọn nhân viên")
      return
    }
    if (selectedWorkshiftIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một ca làm việc")
      return
    }

    try {
      setSubmitting(true)
      await api.assignShifts({
        system_user_id: selectedUserId,
        workshift_ids: selectedWorkshiftIds,
      })
      toast.success(`Đã phân công ${selectedWorkshiftIds.length} ca làm việc`)
      resetForm()
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      toast.error("Không thể phân công: " + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  function renderUserList(users: SystemUserRecord[]) {
    if (users.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Không có nhân viên nào
        </div>
      )
    }

    return (
      <ScrollArea className="h-[200px] border rounded-md">
        <div className="p-4 space-y-2">
          {users.map((user) => {
            const email =
              typeof user.userId === "object" ? user.userId.email : ""
            return (
              <div
                key={user._id}
                onClick={() => setSelectedUserId(user._id)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedUserId === user._id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium">{user.name}</div>
                {email && (
                  <div className="text-sm text-muted-foreground">{email}</div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Phân công ca làm việc</DialogTitle>
          <DialogDescription>
            Chọn nhân viên hoặc kỹ thuật viên và các ca làm việc cần phân công
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Chọn nhân viên */}
          <div className="space-y-3">
            <Label>1. Chọn nhân viên</Label>
            <Tabs defaultValue="staff" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="staff">
                  <Users className="h-4 w-4 mr-2" />
                  Nhân viên ({staffUsers.length})
                </TabsTrigger>
                <TabsTrigger value="technician">
                  <UserCog className="h-4 w-4 mr-2" />
                  Kỹ thuật viên ({technicianUsers.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="staff" className="mt-4">
                {renderUserList(staffUsers)}
              </TabsContent>
              <TabsContent value="technician" className="mt-4">
                {renderUserList(technicianUsers)}
              </TabsContent>
            </Tabs>
          </div>

          {/* Lọc theo trung tâm */}
          <div className="space-y-2">
            <Label>2. Lọc theo trung tâm (tùy chọn)</Label>
            <Select value={selectedCenter} onValueChange={setSelectedCenter}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn trung tâm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trung tâm</SelectItem>
                {centers.map((center) => (
                  <SelectItem key={center._id} value={center._id}>
                    {center.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chọn ca làm việc */}
          <div className="space-y-2">
            <Label>3. Chọn ca làm việc</Label>
            <ScrollArea className="h-[300px] border rounded-md">
              <div className="p-4 space-y-2">
                {filteredWorkshifts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Không có ca làm việc nào
                  </div>
                ) : (
                  filteredWorkshifts.map((ws) => (
                    <div
                      key={ws._id}
                      className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        id={`ws-${ws._id}`}
                        checked={selectedWorkshiftIds.includes(ws._id)}
                        onCheckedChange={() => toggleWorkshift(ws._id)}
                      />
                      <label
                        htmlFor={`ws-${ws._id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {formatShiftDate(ws.shift_date)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {ws.start_time} - {ws.end_time}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {getCenterName(ws.center_id)}
                            </div>
                          </div>
                          <Badge
                            variant={
                              ws.status === "active"
                                ? "default"
                                : ws.status === "completed"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {ws.status}
                          </Badge>
                        </div>
                      </label>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            {selectedWorkshiftIds.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Đã chọn {selectedWorkshiftIds.length} ca làm việc
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm()
              onOpenChange(false)
            }}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Phân công
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
