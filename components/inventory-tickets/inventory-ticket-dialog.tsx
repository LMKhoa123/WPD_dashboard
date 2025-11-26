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
import { getApiClient, type CenterAutoPartRecord, type CenterRecord, type AutoPartRecord } from "@/lib/api"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { formatVND } from "@/lib/utils"

interface InventoryTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketType: "IN" | "OUT"
  onSaved: () => void
  initialItems?: Array<{ part_id: string; quantity: number }>
  initialDestinationCenter?: string
  initialNotes?: string
}

interface TicketItem {
  part_id: string
  quantity: number
  notes?: string
}

export function InventoryTicketDialog({ 
  open, 
  onOpenChange, 
  ticketType, 
  onSaved,
  initialItems,
  initialDestinationCenter,
  initialNotes
}: InventoryTicketDialogProps) {
  const api = useMemo(() => getApiClient(), [])
  const { user } = useAuth()

  const [loading, setLoading] = useState(false)
  const [centerParts, setCenterParts] = useState<CenterAutoPartRecord[]>([]) // For OUT tickets
  const [autoParts, setAutoParts] = useState<AutoPartRecord[]>([]) // For IN tickets
  const [centers, setCenters] = useState<CenterRecord[]>([])
  const [items, setItems] = useState<TicketItem[]>([])
  const [notes, setNotes] = useState("")

  // For IN tickets: source
  const [sourceType, setSourceType] = useState<"SUPPLIER" | "CENTER">("SUPPLIER")
  const [sourceCenter, setSourceCenter] = useState<string>("")

  // For OUT tickets: destination
  const [destinationType, setDestinationType] = useState<"CENTER" | "CUSTOMER">("CENTER")
  const [destinationCenter, setDestinationCenter] = useState<string>("")

  useEffect(() => {
    if (open && user?.centerId) {
      if (ticketType === "IN") {
        loadAutoParts() // Load all auto parts for IN tickets
      } else {
        loadCenterParts() // Load center inventory for OUT tickets
      }
      loadCenters()
    }
  }, [open, user, ticketType])

  useEffect(() => {
    if (open) {
      // Reset form or populate with initial data
      if (initialItems && initialItems.length > 0) {
        setItems(initialItems.map(item => ({
          part_id: item.part_id,
          quantity: item.quantity,
          notes: ""
        })))
      } else {
        setItems([])
      }
      
      if (initialNotes) {
        setNotes(initialNotes)
      } else {
        setNotes("")
      }
      
      if (initialDestinationCenter) {
        setDestinationCenter(initialDestinationCenter)
      } else {
        setDestinationCenter("")
      }
      
      setSourceType("SUPPLIER")
      setSourceCenter("")
      setDestinationType("CENTER")
    }
  }, [open, initialItems, initialDestinationCenter, initialNotes])

  const loadAutoParts = async () => {
    try {
      const res = await api.getAutoParts(1, 500)
      setAutoParts(res.data.parts)
    } catch (error: any) {
      console.error("Failed to load auto parts:", error)
      toast.error("Failed to load parts list")
    }
  }

  const loadCenterParts = async () => {
    if (!user?.centerId) return
    try {
      const res = await api.getCenterAutoParts({ center_id: user.centerId, limit: 500 })
      setCenterParts(res.data.items)
    } catch (error: any) {
      console.error("Failed to load center parts:", error)
      toast.error("Failed to load parts list")
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

  const handleAddItem = () => {
    setItems([...items, { part_id: "", quantity: 1, notes: "" }])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof TicketItem, value: string | number) => {
    const newItems = [...items]
    if (field === "part_id") {
      newItems[index].part_id = value as string
    } else if (field === "quantity") {
      newItems[index].quantity = value as number
    } else if (field === "notes") {
      newItems[index].notes = value as string
    }
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      toast.error("Please add at least one item")
      return
    }

    if (items.some((item) => !item.part_id || item.quantity <= 0)) {
      toast.error("Please fill in all item information")
      return
    }

    // Validate IN ticket
    if (ticketType === "IN") {
      if (sourceType === "CENTER" && !sourceCenter) {
        toast.error("Please select source center")
        return
      }
    }

    // Validate OUT ticket
    if (ticketType === "OUT") {
      if (destinationType === "CENTER" && !destinationCenter) {
        toast.error("Please select destination center")
        return
      }
    }

    try {
      setLoading(true)

      if (!user?.centerId) {
        toast.error("Center information not found")
        return
      }

      // Get profile to get staff_id
      const profile = await api.getProfile()

      const payload: any = {
        center_id: user.centerId,
        ticket_type: ticketType,
        created_by: profile.data._id,
        notes: notes,
        items: items.map((item) => ({
          part_id: item.part_id,
          quantity: item.quantity,
          notes: item.notes || undefined,
        })),
      }

      // Add source for IN tickets
      if (ticketType === "IN") {
        payload.source_type = sourceType
        payload.source_id = sourceType === "CENTER" ? sourceCenter : null
        payload.destination_type = null
        payload.destination_id = null
      }

      // Add destination for OUT tickets
      if (ticketType === "OUT") {
        payload.source_type = null
        payload.source_id = null
        payload.destination_type = destinationType
        payload.destination_id = destinationType === "CENTER" ? destinationCenter : null
      }

      await api.createInventoryTicket(payload)
      toast.success(`${ticketType} ticket created successfully`)
      onSaved()
    } catch (error: any) {
      console.error("Failed to save ticket:", error)
      toast.error(error.message || "Failed to save ticket")
    } finally {
      setLoading(false)
    }
  }

  const getPartInfo = (partId: string) => {
    if (ticketType === "OUT") {
      // For OUT tickets: get info from center inventory
      const centerPart = centerParts.find((cp) => {
        const cpPartId = typeof cp.part_id === "object" ? cp.part_id._id : cp.part_id
        return cpPartId === partId
      })

      if (centerPart && typeof centerPart.part_id === "object") {
        return {
          name: centerPart.part_id.name,
          price: centerPart.part_id.selling_price,
          stock: centerPart.quantity,
        }
      }
    } else {
      // For IN tickets: get info from auto parts (no stock info)
      const autoPart = autoParts.find((ap) => ap._id === partId)
      
      if (autoPart) {
        return {
          name: autoPart.name,
          price: autoPart.selling_price,
          stock: "-", // No stock info for IN tickets
        }
      }
    }
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create {ticketType} Ticket</DialogTitle>
          <DialogDescription>
            {ticketType === "IN"
              ? "Create an inbound ticket for receiving inventory"
              : "Create an outbound ticket for shipping inventory"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Source/Destination Section */}
          {ticketType === "IN" ? (
            <div className="space-y-4">
              <div>
                <Label>Source Type *</Label>
                <Select value={sourceType} onValueChange={(v) => setSourceType(v as "SUPPLIER" | "CENTER")}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPPLIER">Supplier</SelectItem>
                    <SelectItem value="CENTER">Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {sourceType === "CENTER" && (
                <div>
                  <Label>Source Center *</Label>
                  <Select value={sourceCenter} onValueChange={setSourceCenter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select source center" />
                    </SelectTrigger>
                    <SelectContent>
                      {centers
                        .filter((c) => c._id !== user?.centerId)
                        .map((center) => (
                          <SelectItem key={center._id} value={center._id}>
                            {center.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Destination Type *</Label>
                <Select
                  value={destinationType}
                  onValueChange={(v) => setDestinationType(v as "CENTER" )}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CENTER">Center</SelectItem>
                    {/* <SelectItem value="CUSTOMER">Customer</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>

              {destinationType === "CENTER" && (
                <div>
                  <Label>Destination Center *</Label>
                  <Select value={destinationCenter} onValueChange={setDestinationCenter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select destination center" />
                    </SelectTrigger>
                    <SelectContent>
                      {centers
                        .filter((c) => c._id !== user?.centerId)
                        .map((center) => (
                          <SelectItem key={center._id} value={center._id}>
                            {center.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Enter notes for the ticket..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Items List</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-md">
                No items yet. Click "Add Item" to start.
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead className="w-[120px]">Stock</TableHead>
                      <TableHead className="w-[120px]">Quantity</TableHead>
                      <TableHead className="w-[200px]">Item Notes</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => {
                      const partInfo = getPartInfo(item.part_id)
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <Select
                              value={item.part_id}
                              onValueChange={(value) => handleItemChange(index, "part_id", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select part" />
                              </SelectTrigger>
                              <SelectContent>
                                {ticketType === "IN" ? (
                                  // For IN tickets: show all auto parts
                                  autoParts.map((part) => (
                                    <SelectItem key={part._id} value={part._id}>
                                      {part.name} - {formatVND(part.selling_price)} - {part.category}
                                    </SelectItem>
                                  ))
                                ) : (
                                  // For OUT tickets: show center inventory
                                  centerParts.map((centerPart) => {
                                    const partId =
                                      typeof centerPart.part_id === "object"
                                        ? centerPart.part_id._id
                                        : centerPart.part_id
                                    const partName =
                                      typeof centerPart.part_id === "object" ? centerPart.part_id.name : "N/A"
                                    const partPrice =
                                      typeof centerPart.part_id === "object"
                                        ? centerPart.part_id.selling_price
                                        : 0

                                    return (
                                      <SelectItem key={centerPart._id} value={partId}>
                                        {partName} - {formatVND(partPrice)}
                                      </SelectItem>
                                    )
                                  })
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {partInfo ? (
                              <span className="text-sm font-medium">{partInfo.stock}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(index, "quantity", parseInt(e.target.value) || 1)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="Optional notes"
                              value={item.notes || ""}
                              onChange={(e) => handleItemChange(index, "notes", e.target.value)}
                            />
                          </TableCell>
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
                        </TableRow>
                      )
                    })}
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
              {loading ? "Creating..." : `Create ${ticketType} Ticket`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
