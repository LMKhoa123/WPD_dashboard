"use client"

import React, { useMemo, useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getApiClient, type InventoryTicketRecord } from "@/lib/api"
import { toast } from "sonner"
import { format } from "date-fns"
import { formatVND } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"

interface InventoryTicketDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: InventoryTicketRecord | null
  onTicketUpdated: () => void
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-500",
  PENDING: "bg-yellow-500",
  APPROVED: "bg-blue-500",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-red-500",
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  APPROVED: "Approved",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

export function InventoryTicketDetailDialog({
  open,
  onOpenChange,
  ticket,
  onTicketUpdated,
}: InventoryTicketDetailDialogProps) {
  const api = useMemo(() => getApiClient(), [])
  const { user } = useAuth()
  const [actionLoading, setActionLoading] = useState(false)

  if (!ticket) return null

  // Determine if current user can change status
  const canChangeStatus = () => {
    if (!user?.centerId) return false

    const ticketCenterId = typeof ticket.center_id === "object" ? ticket.center_id._id : ticket.center_id

    // For IN tickets
    if (ticket.ticket_type === "IN") {
      // Staff of the receiving center (center_id) can change status
      return ticketCenterId === user.centerId
    }

    // For OUT tickets
    if (ticket.ticket_type === "OUT") {
      // Staff of the sending center (center_id) can change status
      return ticketCenterId === user.centerId
    }

    return false
  }

  const userCanChangeStatus = canChangeStatus()

  const handleApprove = async () => {
    try {
      setActionLoading(true)
      await api.updateInventoryTicket(ticket._id, { status: "IN-PROGRESS" })
      toast.success("Ticket approved successfully")
      onTicketUpdated()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Failed to approve:", error)
      toast.error(error.message || "Failed to approve ticket")
    } finally {
      setActionLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!confirm("Mark this ticket as completed? This will update inventory quantities.")) return
    try {
      setActionLoading(true)
      await api.updateInventoryTicket(ticket._id, { status: "COMPLETED" })
      toast.success("Ticket completed successfully. Inventory updated.")
      onTicketUpdated()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Failed to complete:", error)
      toast.error(error.message || "Failed to complete ticket")
    } finally {
      setActionLoading(false)
    }
  }

  const canApprove = userCanChangeStatus && ticket.status === "PENDING"
  const canComplete = userCanChangeStatus && ticket.status === "IN-PROGRESS"

  const getSourceDisplay = () => {
    if (!ticket.source_type) return null
    if (ticket.source_type === "SUPPLIER") return "Supplier"
    if (ticket.source_type === "CENTER" && ticket.source_id) {
      return typeof ticket.source_id === "object" ? ticket.source_id.name : "Center"
    }
    return ticket.source_type
  }

  const getDestinationDisplay = () => {
    if (!ticket.destination_type) return null
    if (ticket.destination_type === "CENTER" && ticket.destination_id) {
      return typeof ticket.destination_id === "object" ? ticket.destination_id.name : "Center"
    }
    if (ticket.destination_type === "CUSTOMER") return "Customer"
    return ticket.destination_type
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ticket Details</DialogTitle>
          <DialogDescription>Ticket Number: {ticket.ticket_number}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Type</Label>
              <div className="mt-1 font-medium">{ticket.ticket_type}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">
                <Badge className={STATUS_COLORS[ticket.status] || "bg-gray-500"}>
                  {STATUS_LABELS[ticket.status] || ticket.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Center</Label>
              <div className="mt-1">{typeof ticket.center_id === "object" ? ticket.center_id.name : "N/A"}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Created By</Label>
              <div className="mt-1">
                {typeof ticket.created_by === "object" ? ticket.created_by.name : "N/A"}
              </div>
            </div>
          </div>

          {/* Source/Destination based on ticket type */}
          {ticket.ticket_type === "IN" && getSourceDisplay() && (
            <div>
              <Label className="text-muted-foreground">Source</Label>
              <div className="mt-1">{getSourceDisplay()}</div>
            </div>
          )}

          {ticket.ticket_type === "OUT" && getDestinationDisplay() && (
            <div>
              <Label className="text-muted-foreground">Destination</Label>
              <div className="mt-1">{getDestinationDisplay()}</div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Created At</Label>
              <div className="mt-1">{format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm")}</div>
            </div>
            {ticket.completed_date && (
              <div>
                <Label className="text-muted-foreground">Completed At</Label>
                <div className="mt-1">{format(new Date(ticket.completed_date), "dd/MM/yyyy HH:mm")}</div>
              </div>
            )}
          </div>

          {/* Notes */}
          {ticket.notes && (
            <div>
              <Label className="text-muted-foreground">Notes</Label>
              <div className="mt-1 text-sm">{ticket.notes}</div>
            </div>
          )}

          {/* Items */}
          <div>
            <Label className="text-muted-foreground">Items</Label>
            <div className="mt-2 border rounded-md">
              {ticket.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No items</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ticket.items.map((item, index) => {
                      const part = typeof item.part_id === "object" ? item.part_id : null
                      const unitPrice = part?.selling_price || 0
                      const total = unitPrice * item.quantity

                      return (
                        <TableRow key={index}>
                          <TableCell>{part?.name || "N/A"}</TableCell>
                          <TableCell>{part?.category || "N/A"}</TableCell>
                          <TableCell className="text-right">{formatVND(unitPrice)}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right font-medium">{formatVND(total)}</TableCell>
                        </TableRow>
                      )
                    })}
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-medium">
                        Total Amount:
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatVND(
                          ticket.items.reduce((sum, item) => {
                            const part = typeof item.part_id === "object" ? item.part_id : null
                            const unitPrice = part?.selling_price || 0
                            return sum + unitPrice * item.quantity
                          }, 0)
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>

          {canApprove && (
            <Button onClick={handleApprove} disabled={actionLoading}>
              {actionLoading ? "Processing..." : "Approve"}
            </Button>
          )}

          {canComplete && (
            <Button onClick={handleComplete} disabled={actionLoading}>
              {actionLoading ? "Processing..." : "Mark as Completed"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
