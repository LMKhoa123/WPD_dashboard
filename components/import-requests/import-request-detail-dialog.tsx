"use client"

import React, { useEffect, useMemo, useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getApiClient, type ImportRequestRecord, type ImportRequestItem, type CenterRecord } from "@/lib/api"
import { toast } from "sonner"
import { format } from "date-fns"
import { formatVND } from "@/lib/utils"
import { useIsAdmin } from "@/components/auth-provider"

interface ImportRequestDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: ImportRequestRecord | null
  onRequestUpdated: () => void
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

export function ImportRequestDetailDialog({
  open,
  onOpenChange,
  request,
  onRequestUpdated,
}: ImportRequestDetailDialogProps) {
  const api = useMemo(() => getApiClient(), [])
  const isAdmin = useIsAdmin()

  const [items, setItems] = useState<ImportRequestItem[]>([])
  const [centers, setCenters] = useState<CenterRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // For admin to assign source center
  const [selectedSourceCenter, setSelectedSourceCenter] = useState<string>("")

  useEffect(() => {
    if (open && request) {
      loadItems()
      if (isAdmin) {
        loadCenters()
      }
      if (request.source_center_id) {
        setSelectedSourceCenter(
          typeof request.source_center_id === "object"
            ? request.source_center_id._id
            : request.source_center_id
        )
      } else {
        setSelectedSourceCenter("")
      }
    }
  }, [open, request, isAdmin])

  const loadItems = async () => {
    if (!request) return
    try {
      setLoading(true)
      const data = await api.getImportRequestItems(request._id)
      setItems(data)
    } catch (error: any) {
      console.error("Failed to load items:", error)
      toast.error("Failed to load parts list")
    } finally {
      setLoading(false)
    }
  }

  const loadCenters = async () => {
    try {
      const res = await api.getCenters({ limit: 200 })
      setCenters(res.data.centers)
    } catch (error: any) {
      console.error("Failed to load centers:", error)
    }
  }

  const handleSubmitForApproval = async () => {
    if (!request) return
    try {
      setActionLoading(true)
      await api.updateImportRequest(request._id, { status: "PENDING" })
      toast.success("Request submitted for approval")
      onRequestUpdated()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Failed to submit:", error)
      toast.error(error.message || "Failed to submit request")
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!request) return
    if (!selectedSourceCenter) {
      toast.error("Please select a source center")
      return
    }

    try {
      setActionLoading(true)
      await api.updateImportRequest(request._id, {
        status: "APPROVED",
        source_center_id: selectedSourceCenter,
      })
      toast.success("Request approved successfully")
      onRequestUpdated()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Failed to approve:", error)
      toast.error(error.message || "Failed to approve request")
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!request) return
    if (!confirm("Are you sure you want to reject this request?")) return

    try {
      setActionLoading(true)
      await api.updateImportRequest(request._id, { status: "CANCELLED" })
      toast.success("Request rejected")
      onRequestUpdated()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Failed to reject:", error)
      toast.error(error.message || "Failed to reject request")
    } finally {
      setActionLoading(false)
    }
  }

  if (!request) return null

  const canSubmit = request.status === "DRAFT"
  const canApprove = isAdmin && request.status === "PENDING"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Request Details</DialogTitle>
          <DialogDescription>
            Request ID: {request._id.slice(-8).toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">
                <Badge className={STATUS_COLORS[request.status] || "bg-gray-500"}>
                  {STATUS_LABELS[request.status] || request.status}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Created At</Label>
              <div className="mt-1">{format(new Date(request.createdAt), "dd/MM/yyyy HH:mm")}</div>
            </div>
          </div>

          {/* Center and Staff */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Requesting Center</Label>
              <div className="mt-1">
                {typeof request.center_id === "object" ? request.center_id.name : "N/A"}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Created By</Label>
              <div className="mt-1">
                {typeof request.staff_id === "object" ? request.staff_id.name : "N/A"}
              </div>
            </div>
          </div>

          {/* Source Center */}
          {canApprove ? (
            <div>
              <Label>Source Center *</Label>
              <Select value={selectedSourceCenter} onValueChange={setSelectedSourceCenter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select source center" />
                </SelectTrigger>
                <SelectContent>
                  {centers
                    .filter((c) => {
                      const requestCenterId =
                        typeof request.center_id === "object"
                          ? request.center_id._id
                          : request.center_id
                      return c._id !== requestCenterId
                    })
                    .map((center) => (
                      <SelectItem key={center._id} value={center._id}>
                        {center.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            request.source_center_id && (
              <div>
                <Label className="text-muted-foreground">Source Center</Label>
                <div className="mt-1">
                  {typeof request.source_center_id === "object"
                    ? request.source_center_id.name
                    : "N/A"}
                </div>
              </div>
            )
          )}

          {/* Description */}
          {request.description && (
            <div>
              <Label className="text-muted-foreground">Notes</Label>
              <div className="mt-1 text-sm">{request.description}</div>
            </div>
          )}

          {/* Items Table */}
          <div>
            <Label className="text-muted-foreground">Parts List</Label>
            <div className="mt-2 border rounded-md">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No parts found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Selling Price</TableHead>
                      <TableHead className="text-right">Quantity Needed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>
                          {typeof item.part_id === "object" ? item.part_id.name : "N/A"}
                        </TableCell>
                        <TableCell>
                          {typeof item.part_id === "object" ? item.part_id.category : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          {typeof item.part_id === "object"
                            ? formatVND(item.part_id.selling_price)
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">{item.quantity_needed}</TableCell>
                      </TableRow>
                    ))}
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

          {canSubmit && (
            <Button onClick={handleSubmitForApproval} disabled={actionLoading}>
              {actionLoading ? "Processing..." : "Submit for Approval"}
            </Button>
          )}

          {canApprove && (
            <>
              <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
                Reject
              </Button>
              <Button onClick={handleApprove} disabled={actionLoading}>
                {actionLoading ? "Processing..." : "Approve"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
