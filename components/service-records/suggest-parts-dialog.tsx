"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getApiClient, type AutoPartRecord } from "@/lib/api"
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
}

interface PartQuantity {
  [partId: string]: number // part ID -> quantity
}

export function SuggestPartsDialog({ checklistItemId, currentSuggested, trigger, onSaved }: SuggestPartsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [parts, setParts] = useState<AutoPartRecord[]>([])
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
        const res = await api.getAutoParts(1, 500) // Get all parts
        setParts(res.data.parts)
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
  }, [open, api, currentSuggested, toast])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const newSelected = { ...prev, [id]: !prev[id] }
      // If unchecking, reset quantity to 1
      if (!newSelected[id]) {
        setQuantities((q) => ({ ...q, [id]: 1 }))
      } else {
        // If checking and no quantity set, default to 1
        if (!quantities[id]) {
          setQuantities((q) => ({ ...q, [id]: 1 }))
        }
      }
      return newSelected
    })
  }

  const updateQuantity = (partId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[partId] || 1
      const newQty = Math.max(1, current + delta) // Minimum 1
      return { ...prev, [partId]: newQty }
    })
  }

  const setQuantity = (partId: string, value: string) => {
    const num = parseInt(value)
    if (!isNaN(num) && num >= 1) {
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

  const filteredParts = parts.filter((part) =>
    part.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
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

            <ScrollArea className="max-h-96 border rounded-md p-3">
              {loading ? (
                <div className="text-muted-foreground">Đang tải...</div>
              ) : filteredParts.length === 0 ? (
                <div className="text-muted-foreground">
                  {searchQuery ? "Không tìm thấy linh kiện phù hợp" : "Chưa có linh kiện nào."}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredParts.map((part) => (
                    <div key={part._id} className="flex items-start gap-3 p-2 hover:bg-accent rounded-md">
                      <Checkbox 
                        checked={!!selected[part._id]} 
                        onCheckedChange={() => toggle(part._id)} 
                      />
                      <div className="flex-1">
                        <div className="font-medium">{part.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Giá bán: {part.selling_price.toLocaleString("vi-VN")} VNĐ
                        </div>
                      </div>
                      
                      {/* Quantity selector - only show when selected */}
                      {selected[part._id] && (
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(part._id, -1)}
                            disabled={quantities[part._id] <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={quantities[part._id] || 1}
                            onChange={(e) => setQuantity(part._id, e.target.value)}
                            className="h-8 w-16 text-center"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(part._id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
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
