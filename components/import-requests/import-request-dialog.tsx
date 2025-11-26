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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getApiClient, type ImportRequestRecord, type AutoPartRecord } from "@/lib/api"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { formatVND } from "@/lib/utils"

interface ImportRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: ImportRequestRecord | null
  onSaved: () => void
}

interface RequestItem {
  part_id: string
  quantity_needed: number
}

export function ImportRequestDialog({ open, onOpenChange, request, onSaved }: ImportRequestDialogProps) {
  const api = useMemo(() => getApiClient(), [])
  const { user } = useAuth()

  const [loading, setLoading] = useState(false)
  const [parts, setParts] = useState<AutoPartRecord[]>([])
  const [items, setItems] = useState<RequestItem[]>([])
  const [description, setDescription] = useState("")

  // Check if request can be edited (only DRAFT status)
  const isEditable = request?.status === "DRAFT"

  // Load parts list
  useEffect(() => {
    if (open) {
      loadParts()
    }
  }, [open])

  // Load existing request data if editing
  useEffect(() => {
    if (open && request) {
      setDescription(request.description || "")
      loadRequestItems(request._id)
    } else if (open && !request) {
      setItems([])
      setDescription("")
    }
  }, [open, request])

  const loadParts = async () => {
    try {
      const res = await api.getAutoParts(1, 500)
      setParts(res.data.parts)
    } catch (error: any) {
      console.error("Failed to load parts:", error)
      toast.error("Failed to load parts list")
    }
  }

  const loadRequestItems = async (requestId: string) => {
    try {
      const itemsData = await api.getImportRequestItems(requestId)
      setItems(
        itemsData.map((item) => ({
          part_id: typeof item.part_id === "object" ? item.part_id._id : item.part_id,
          quantity_needed: item.quantity_needed,
        }))
      )
    } catch (error: any) {
      console.error("Failed to load request items:", error)
    }
  }

  const handleAddItem = () => {
    setItems([...items, { part_id: "", quantity_needed: 1 }])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof RequestItem, value: string | number) => {
    const newItems = [...items]
    if (field === "part_id") {
      newItems[index].part_id = value as string
    } else if (field === "quantity_needed") {
      newItems[index].quantity_needed = value as number
    }
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      toast.error("Please add at least one part")
      return
    }

    if (items.some((item) => !item.part_id || item.quantity_needed <= 0)) {
      toast.error("Please fill in all part information")
      return
    }

    try {
      setLoading(true)

      if (request) {
        // Update existing request (only DRAFT can be edited)
        await api.updateImportRequest(request._id, {
          notes: description || undefined,
          items: items.map((item) => ({
            part_id: item.part_id,
            quantity_needed: item.quantity_needed,
          })),
        })
        toast.success("Import request updated successfully")
      } else {
        // Create new request
        if (!user?.centerId) {
          toast.error("Center information not found")
          return
        }

        // Get profile to get staff_id
        const profile = await api.getProfile()
        
        await api.createImportRequest({
          center_id: user.centerId,
          staff_id: profile.data._id,
          notes: description || undefined,
          items: items.map((item) => ({
            part_id: item.part_id,
            quantity_needed: item.quantity_needed,
          })),
        })
        toast.success("Import request created successfully")
      }

      onSaved()
    } catch (error: any) {
      console.error("Failed to save import request:", error)
      toast.error(error.message || "Failed to save import request")
    } finally {
      setLoading(false)
    }
  }

  const getPartName = (partId: string) => {
    const part = parts.find((p) => p._id === partId)
    return part ? `${part.name} - ${formatVND(part.selling_price)}` : "Chọn phụ tùng"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {request ? "Edit Import Request" : "Create New Import Request"}
          </DialogTitle>
          <DialogDescription>
            {request
              ? "Update import request information"
              : "Create a restock request from main warehouse or another center"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Notes</Label>
            <Textarea
              id="description"
              placeholder="Enter notes for the request..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Parts List</Label>
              {(!request || isEditable) && (
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Part
                </Button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-md">
                No parts yet. Click "Add Part" to start.
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead className="w-[150px]">Quantity</TableHead>
                      {(!request || isEditable) && <TableHead className="w-[80px]"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {request && !isEditable ? (
                            <span>{getPartName(item.part_id)}</span>
                          ) : (
                            <Select
                              value={item.part_id}
                              onValueChange={(value) => handleItemChange(index, "part_id", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select part" />
                              </SelectTrigger>
                              <SelectContent>
                                {parts.map((part) => (
                                  <SelectItem key={part._id} value={part._id}>
                                    {part.name} - {formatVND(part.selling_price)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity_needed}
                            onChange={(e) =>
                              handleItemChange(index, "quantity_needed", parseInt(e.target.value) || 1)
                            }
                            disabled={request ? !isEditable : false}
                          />
                        </TableCell>
                        {(!request || isEditable) && (
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : request ? "Update" : "Create Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
