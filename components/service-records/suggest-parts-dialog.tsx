"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getApiClient, type CenterAutoPartRecord } from "@/lib/api"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Minus, Plus } from "lucide-react"

interface SuggestPartsDialogProps {
  checklistItemId: string
  currentSuggested: string[] // current suggested part IDs
  trigger: React.ReactNode
  onSaved?: () => void
  centerId?: string // center ID to load parts from
}

interface PartQuantity {
  [partId: string]: number // part ID -> quantity
}

interface PartWithStock extends CenterAutoPartRecord {
  part_name: string // for easier access to part name
}

export function SuggestPartsDialog({ checklistItemId, currentSuggested, trigger, onSaved, centerId }: SuggestPartsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [parts, setParts] = useState<PartWithStock[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [quantities, setQuantities] = useState<PartQuantity>({})
  const [searchQuery, setSearchQuery] = useState("")
  
  const api = useMemo(() => getApiClient(), [])

  useEffect(() => {
    if (!open) return
    const run = async () => {
      try {
        setLoading(true)
        const res = await api.getCenterAutoParts({
          limit: 500,
          center_id: centerId,
        })
        // Transform response to include part_name for easier access
        const transformedParts: PartWithStock[] = res.data.items.map((item) => ({
          ...item,
          part_name: typeof item.part_id === 'string' ? item.part_id : item.part_id.name,
        }))
        setParts(transformedParts)
        // Initialize selected and quantities based on current suggested
        // Use center auto part id (_id). If there are duplicates, they represent quantity.
        const counts: PartQuantity = {}
        currentSuggested.forEach((id) => {
          counts[id] = (counts[id] || 0) + 1
        })
        const initialSelected: Record<string, boolean> = {}
        Object.keys(counts).forEach((id) => {
          initialSelected[id] = true
        })
        setSelected(initialSelected)
        setQuantities(counts)
      } catch (e: any) {
        toast.error("Failed to load parts", { description: e?.message || "Failed to load parts" })
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [open, api, currentSuggested, centerId, toast])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const newSelected = { ...prev, [id]: !prev[id] }
      // If unchecking, reset quantity to 1
      if (!newSelected[id]) {
        setQuantities((q) => ({ ...q, [id]: 1 }))
      } else {
        // If checking and no quantity set, default to 1
        if (quantities[id] === undefined) {
          setQuantities((q) => ({ ...q, [id]: 1 }))
        }
      }
      return newSelected
    })
  }

  const updateQuantity = (centerPartId: string, delta: number) => {
    // centerPartId is the CenterAutoPart record _id
    const part = parts.find((p) => p._id === centerPartId)
    if (!part) return

    setQuantities((prev) => {
      const current = prev[centerPartId] || 1
      const newQty = Math.max(1, current + delta)
      const maxQty = part.quantity // Max available quantity from stock
      return { ...prev, [centerPartId]: Math.min(newQty, maxQty) }
    })
  }

  const setQuantity = (centerPartId: string, value: string) => {
    // centerPartId is the CenterAutoPart record _id
    const part = parts.find((p) => p._id === centerPartId)
    if (!part) return

    const num = parseInt(value)
    const maxQty = part.quantity
    if (!isNaN(num) && num >= 1 && num <= maxQty) {
      setQuantities((prev) => ({ ...prev, [centerPartId]: num }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Calculate diffs by quantity between currentSuggested and the new selection
    const countsOld: Record<string, number> = {}
    currentSuggested.forEach((id) => {
      countsOld[id] = (countsOld[id] || 0) + 1
    })
    const countsNew: Record<string, number> = {}
    Object.keys(selected).forEach((id) => {
      if (selected[id]) {
        countsNew[id] = quantities[id] || 1
      }
    })

    const allIds = new Set<string>([...Object.keys(countsOld), ...Object.keys(countsNew)])
    const suggest_add: string[] = []
    const suggest_remove: string[] = []
    allIds.forEach((id) => {
      const oldCount = countsOld[id] || 0
      const newCount = countsNew[id] || 0
      const delta = newCount - oldCount
      if (delta > 0) {
        for (let i = 0; i < delta; i++) suggest_add.push(id)
      } else if (delta < 0) {
        for (let i = 0; i < -delta; i++) suggest_remove.push(id)
      }
    })

    // If no changes, just close
    if (suggest_add.length === 0 && suggest_remove.length === 0) {
      setOpen(false)
      return
    }

    try {
      setSubmitting(true)
      await api.updateRecordChecklist(checklistItemId, { suggest_add, suggest_remove })
  toast.success("Suggested parts updated")
      setOpen(false)
      onSaved?.()
    } catch (e: any) {
      toast.error("Update failed", { description: e?.message || "Failed to update" })
    } finally {
      setSubmitting(false)
    }
  }

  const filteredParts = parts.filter((part) => {
    const partName = typeof part.part_id === 'string' ? part.part_id : part.part_id.name
    return partName.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Suggest replacement parts</DialogTitle>
            <DialogDescription>Select parts to suggest for replacement in this checklist item.</DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-3">
            <Input
              placeholder="Search parts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="text-sm text-muted-foreground">
              Selected: <Badge variant="secondary">{Object.keys(selected).filter((k) => selected[k]).length}</Badge>
            </div>

            {/* Force a fixed viewport height for the parts list so Radix ScrollArea can render the scrollbar */}
            <ScrollArea className="h-[60vh] border rounded-md p-3 pr-2">
              {loading ? (
                <div className="text-muted-foreground">Loading...</div>
              ) : filteredParts.length === 0 ? (
                <div className="text-muted-foreground">
                  {searchQuery ? "No matching parts found" : "No parts available."}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredParts.map((part) => {
                    // Use center auto part id for selection and submission
                    const partId = part._id
                    const partName = typeof part.part_id === 'string' ? part.part_id : part.part_id.name
                    const sellingPrice = typeof part.part_id === 'string' ? 0 : part.part_id.selling_price
                    const maxQty = part.quantity
                    const currentQty = quantities[partId] || 1
                    const isSelected = !!selected[partId]

                    return (
                      <div key={part._id} className="flex flex-col gap-2 p-2 hover:bg-accent rounded-md border">
                        <div className="flex gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggle(partId)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{partName}</div>
                            <div className="text-sm text-muted-foreground">
                              Selling Price: {sellingPrice.toLocaleString("vi-VN")} VND
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Stock: <Badge variant="outline">{maxQty}</Badge>
                            </div>
                          </div>
                        </div>

                        {/* Quantity selector - always show to maintain consistent layout */}
                        <div className={`flex items-center gap-2 ml-7 ${!isSelected ? 'opacity-40' : ''}`}>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 flex-shrink-0"
                            onClick={() => updateQuantity(partId, -1)}
                            disabled={!isSelected || currentQty <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            max={maxQty}
                            value={currentQty}
                            onChange={(e) => isSelected && setQuantity(partId, e.target.value)}
                            disabled={!isSelected}
                            className="h-7 w-12 text-center text-xs flex-shrink-0"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 flex-shrink-0"
                            onClick={() => updateQuantity(partId, 1)}
                            disabled={!isSelected || currentQty >= maxQty}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            / {maxQty}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
