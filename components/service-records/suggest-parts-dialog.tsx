"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getApiClient, type CenterAutoPartRecord } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
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
  const { toast } = useToast()
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
        // Initialize selected based on current suggested
        const initial: Record<string, boolean> = {}
        const initialQty: PartQuantity = {}
        currentSuggested.forEach((id) => {
          initial[id] = true
          initialQty[id] = 1 // Default quantity is 1
        })
        setSelected(initial)
        setQuantities(initialQty)
      } catch (e: any) {
        toast({ title: "Không tải được danh sách linh kiện", description: e?.message || "Failed to load parts", variant: "destructive" })
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

  const updateQuantity = (partId: string, delta: number) => {
    // partId here is the AutoPart ID; find the corresponding center-part item
    const part = parts.find(
      (p) => (typeof p.part_id === 'string' ? p.part_id : p.part_id._id) === partId
    )
    if (!part) return

    setQuantities((prev) => {
      const current = prev[partId] || 1
      const newQty = Math.max(1, current + delta)
      const maxQty = part.quantity // Max available quantity from stock
      return { ...prev, [partId]: Math.min(newQty, maxQty) }
    })
  }

  const setQuantity = (partId: string, value: string) => {
    // partId here is the AutoPart ID; find the corresponding center-part item
    const part = parts.find(
      (p) => (typeof p.part_id === 'string' ? p.part_id : p.part_id._id) === partId
    )
    if (!part) return

    const num = parseInt(value)
    const maxQty = part.quantity
    if (!isNaN(num) && num >= 1 && num <= maxQty) {
      setQuantities((prev) => ({ ...prev, [partId]: num }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Calculate which parts to add and which to remove
    const newSelected = Object.keys(selected).filter((k) => selected[k])

    // Build suggest_add with quantities: repeat part ID by quantity
    const suggest_add: string[] = []
    newSelected.forEach((partId) => {
      if (!currentSuggested.includes(partId)) {
        const qty = quantities[partId] || 1
        for (let i = 0; i < qty; i++) {
          suggest_add.push(partId)
        }
      }
    })

    const suggest_remove = currentSuggested.filter((id) => !newSelected.includes(id))

    // If no changes, just close
    if (suggest_add.length === 0 && suggest_remove.length === 0) {
      setOpen(false)
      return
    }

    try {
      setSubmitting(true)
      await api.updateRecordChecklist(checklistItemId, { suggest_add, suggest_remove })
      toast({ title: "Đã cập nhật đề xuất linh kiện" })
      setOpen(false)
      onSaved?.()
    } catch (e: any) {
      toast({ title: "Cập nhật thất bại", description: e?.message || "Failed to update", variant: "destructive" })
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
            <DialogTitle>Đề xuất linh kiện cần thay thế</DialogTitle>
            <DialogDescription>Chọn các linh kiện cần đề xuất thay thế cho hạng mục này.</DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-3">
            <Input
              placeholder="Tìm kiếm linh kiện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="text-sm text-muted-foreground">
              Đã chọn: <Badge variant="secondary">{Object.keys(selected).filter((k) => selected[k]).length}</Badge>
            </div>

            {/* Force a fixed viewport height for the parts list so Radix ScrollArea can render the scrollbar */}
            <ScrollArea className="h-[60vh] border rounded-md p-3 pr-2">
              {loading ? (
                <div className="text-muted-foreground">Đang tải...</div>
              ) : filteredParts.length === 0 ? (
                <div className="text-muted-foreground">
                  {searchQuery ? "Không tìm thấy linh kiện phù hợp" : "Chưa có linh kiện nào."}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredParts.map((part) => {
                    const partId = typeof part.part_id === 'string' ? part.part_id : part.part_id._id
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
                              Giá bán: {sellingPrice.toLocaleString("vi-VN")} VNĐ
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Tồn kho: <Badge variant="outline">{maxQty}</Badge>
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
              {submitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
