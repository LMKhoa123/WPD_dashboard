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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getApiClient, type WorkshiftRecord, type LackingPartItem, type AutoPartRecord } from "@/lib/api"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { formatVND } from "@/lib/utils"
import { AlertCircle, Calendar, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CreateFromShiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemsSelected: (items: Array<{ part_id: string; quantity_needed: number }>, notes: string) => void
  centerId?: string
}

export function CreateFromShiftDialog({ open, onOpenChange, onItemsSelected, centerId }: CreateFromShiftDialogProps) {
  const api = useMemo(() => getApiClient(), [])

  const [shifts, setShifts] = useState<WorkshiftRecord[]>([])
  const [loadingShifts, setLoadingShifts] = useState(false)
  const [selectedShiftId, setSelectedShiftId] = useState<string>("")

  const [lackingParts, setLackingParts] = useState<LackingPartItem[]>([])
  const [loadingParts, setLoadingParts] = useState(false)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Load shifts when dialog opens
  useEffect(() => {
    if (open) {
      loadShifts()
    } else {
      // Reset state when closed
      setSelectedShiftId("")
      setLackingParts([])
      setPage(1)
    }
  }, [open])

  const loadShifts = async (pageNum = 1) => {
    try {
      setLoadingShifts(true)
      const params: any = { page: pageNum, limit: 20 }
      if (centerId) params.center_id = centerId
      
      const res = await api.getWorkshifts(params)
      setShifts(res.data || [])
      if (res.pagination) {
        setTotalPages(res.pagination.total_pages)
      }
    } catch (error: any) {
      console.error("Failed to load shifts:", error)
      toast.error("Failed to load work shifts")
    } finally {
      setLoadingShifts(false)
    }
  }

  const loadLackingParts = async (shiftId: string) => {
    try {
      setLoadingParts(true)
      const res = await api.getLackingPartsByShift({ shift_id: shiftId })
      setLackingParts(res.data || [])
      
      if (!res.data || res.data.length === 0) {
        toast.info("No lacking parts found for this shift")
      }
    } catch (error: any) {
      console.error("Failed to load lacking parts:", error)
      toast.error(error.message || "Failed to load lacking parts")
      setLackingParts([])
    } finally {
      setLoadingParts(false)
    }
  }

  const handleShiftChange = (shiftId: string) => {
    setSelectedShiftId(shiftId)
    if (shiftId) {
      loadLackingParts(shiftId)
    } else {
      setLackingParts([])
    }
  }

  const handleConfirm = () => {
    if (!lackingParts || lackingParts.length === 0) {
      toast.error("No lacking parts to import")
      return
    }

    const selectedShift = shifts.find(s => s._id === selectedShiftId)
    const shiftLabel = selectedShift 
      ? `${new Date(selectedShift.shift_date).toLocaleDateString('vi-VN')} (${selectedShift.start_time}-${selectedShift.end_time})`
      : selectedShiftId

    const items = lackingParts.map(p => ({
      part_id: typeof p.part_id === 'object' ? (p.part_id as AutoPartRecord)._id : p.part_id,
      quantity_needed: p.lackingQuantity
    }))

    const notes = `Auto-generated from shift ${shiftLabel}. Total ${lackingParts.length} lacking parts.`

    onItemsSelected(items, notes)
    onOpenChange(false)
  }

  const selectedShift = shifts.find(s => s._id === selectedShiftId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Import Request from Shift</DialogTitle>
          <DialogDescription>
            Select a work shift to automatically aggregate all lacking parts from appointments in that shift
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Shift Selection */}
          <div className="space-y-2">
            <Label htmlFor="shift">Work Shift</Label>
            <Select value={selectedShiftId} onValueChange={handleShiftChange} disabled={loadingShifts}>
              <SelectTrigger id="shift">
                <SelectValue placeholder="Select a work shift..." />
              </SelectTrigger>
              <SelectContent>
                {shifts.map((shift) => (
                  <SelectItem key={shift._id} value={shift._id}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(shift.shift_date).toLocaleDateString('vi-VN')}
                      <Clock className="h-4 w-4 ml-2" />
                      {shift.start_time} - {shift.end_time}
                      <Badge variant="outline" className="ml-2">{shift.status}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loadingShifts && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" /> Loading shifts...
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center gap-2 text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = page - 1
                    setPage(newPage)
                    loadShifts(newPage)
                  }}
                  disabled={page <= 1 || loadingShifts}
                >
                  Previous
                </Button>
                <span className="text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = page + 1
                    setPage(newPage)
                    loadShifts(newPage)
                  }}
                  disabled={page >= totalPages || loadingShifts}
                >
                  Next
                </Button>
              </div>
            )}
          </div>

          {/* Selected Shift Info */}
          {selectedShift && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">Selected Shift:</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Date:</span>{" "}
                  <span className="font-medium">{new Date(selectedShift.shift_date).toLocaleDateString('vi-VN')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Time:</span>{" "}
                  <span className="font-medium">{selectedShift.start_time} - {selectedShift.end_time}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <Badge variant="outline">{selectedShift.status}</Badge>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loadingParts && (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Spinner /> Loading lacking parts...
            </div>
          )}

          {/* Lacking Parts Table */}
          {!loadingParts && lackingParts.length > 0 && (
            <div className="space-y-2">
              <Label>Lacking Parts Summary</Label>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Name</TableHead>
                      <TableHead className="text-center">Current Stock</TableHead>
                      <TableHead className="text-center">Total Needed</TableHead>
                      <TableHead className="text-center">Lacking Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lackingParts.map((item, idx) => {
                      const part = typeof item.part_id === 'object' ? item.part_id : null
                      const partName = part?.name || String(item.part_id)
                      const unitPrice = part?.selling_price
                      
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{partName}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={item.currentStock === 0 ? "destructive" : "secondary"}>
                              {item.currentStock}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{item.orderQuantity}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="destructive">{item.lackingQuantity}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {unitPrice ? formatVND(unitPrice) : "—"}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <strong>Note:</strong> This will create an import request for <strong>{lackingParts.length}</strong> parts 
                  with a total lacking quantity. All items will be pre-filled in the next step.
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loadingParts && selectedShiftId && lackingParts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No lacking parts found for this shift</p>
              <p className="text-xs mt-1">All parts are sufficiently stocked</p>
            </div>
          )}

          {/* Initial Empty State */}
          {!selectedShiftId && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Select a work shift to view lacking parts</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedShiftId || lackingParts.length === 0 || loadingParts}
          >
            Continue to Create Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
