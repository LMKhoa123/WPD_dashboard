"use client"

import React, { useEffect, useMemo, useState } from "react"
import { getApiClient, type SlotRecord, type SlotStaffTechnicianResponse } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"
import { Users, UserCog, Clock, Mail, Phone, CheckCircle2, XCircle } from "lucide-react"

interface SlotDetailDialogProps {
  slot: SlotRecord
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SlotDetailDialog({ slot, open, onOpenChange }: SlotDetailDialogProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SlotStaffTechnicianResponse["data"] | null>(null)

  const api = useMemo(() => getApiClient(), [])

  useEffect(() => {
    if (open && slot) {
      loadSlotDetail()
    }
  }, [open, slot])

  const loadSlotDetail = async () => {
    try {
      setLoading(true)
      const response = await api.getSlotStaffTechnician(slot._id)
      setData(response.data)
    } catch (e: any) {
      toast.error("Can not load slot details: " + (e?.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Slot Details - {formatDate(slot.slot_date)}
          </DialogTitle>
          <DialogDescription>
            {slot.start_time} - {slot.end_time} | Capacity: {slot.capacity} | Booked: {slot.booked_count}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : !data ? (
          <div className="text-center py-8 text-muted-foreground">
            Cannot load detailed information
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-semibold">{formatDate(data.slot.date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-semibold">{data.slot.startTime} - {data.slot.endTime}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Capacity</p>
                <p className="font-semibold">{data.slot.capacity}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Appointments</p>
                <p className="font-semibold">{data.slot.totalAppointments}</p>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">
                  Staff ({data.staff?.length || 0})
                </h3>
              </div>

              {!data.staff || data.staff.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border rounded-lg">
                  No staff assigned
                </div>
              ) : (
                <div className="grid gap-3">
                  {data.staff.map((member) => (
                    <div
                      key={member.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{member.name}</p>
                            {member.assigned ? (
                              <Badge variant="default" className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Assigned
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <XCircle className="h-3 w-3" />
                                Not Assigned
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                            {member.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {member.email}
                              </div>
                            )}
                            {member.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {member.phone}
                              </div>
                            )}
                            {member.shiftTime && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Shift: {member.shiftTime}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-2 mb-4">
                <UserCog className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">
                  Technicians ({data.technician?.length || 0})
                </h3>
              </div>

              {!data.technician || data.technician.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border rounded-lg">
                  No technicians assigned
                </div>
              ) : (
                <div className="grid gap-3">
                  {data.technician.map((tech) => (
                    <div
                      key={tech.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{tech.name}</p>
                            {tech.assigned ? (
                              <Badge variant="default" className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Assigned
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <XCircle className="h-3 w-3" />
                                Not Assigned
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                            {tech.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {tech.email}
                              </div>
                            )}
                            {tech.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {tech.phone}
                              </div>
                            )}
                            {tech.shiftTime && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Shift: {tech.shiftTime}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
