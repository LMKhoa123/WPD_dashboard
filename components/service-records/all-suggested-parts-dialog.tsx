"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getApiClient, type SuggestedPartItem } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Package, Download } from "lucide-react"

interface AllSuggestedPartsDialogProps {
  recordId: string
  trigger: React.ReactNode
}

export function AllSuggestedPartsDialog({ recordId, trigger }: AllSuggestedPartsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [parts, setParts] = useState<SuggestedPartItem[]>([])
  const { toast } = useToast()
  const api = useMemo(() => getApiClient(), [])

  useEffect(() => {
    if (!open) return
    const run = async () => {
      try {
        setLoading(true)
        const res = await api.getAllSuggestedParts(recordId)
        setParts(res.data || [])
      } catch (e: any) {
        toast({ 
          title: "Không tải được danh sách đề xuất", 
          description: e?.message || "Failed to load suggested parts", 
          variant: "destructive" 
        })
        setParts([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [open, api, recordId, toast])

  const totalCost = (parts || []).reduce((sum, part) => {
    const partData = typeof part.part_id === 'object' ? part.part_id : null
    return sum + ((partData?.cost_price || 0) * part.quantity)
  }, 0)
  
  const totalSelling = (parts || []).reduce((sum, part) => {
    const partData = typeof part.part_id === 'object' ? part.part_id : null
    return sum + ((partData?.selling_price || 0) * part.quantity)
  }, 0)

  const handleExport = () => {
    // Simple export to text format (can be enhanced to CSV/PDF)
    const text = [
      "DANH SÁCH LINH KIỆN ĐỀ XUẤT THAY THẾ",
      "=" .repeat(60),
      "",
      ...parts.map(part => {
        const partData = typeof part.part_id === 'object' ? part.part_id : null
        const partName = partData?.name || 'Unknown Part'
        const costPrice = partData?.cost_price || 0
        const sellingPrice = partData?.selling_price || 0
        
        return `${partName}\n` +
          `  Số lượng: ${part.quantity}\n` +
          `  Giá vốn: ${costPrice.toLocaleString("vi-VN")} VNĐ/cái\n` +
          `  Giá bán: ${sellingPrice.toLocaleString("vi-VN")} VNĐ/cái\n` +
          `  Tổng giá bán: ${(sellingPrice * part.quantity).toLocaleString("vi-VN")} VNĐ\n`
      }),
      "",
      "=" .repeat(60),
      `Tổng giá vốn: ${totalCost.toLocaleString("vi-VN")} VNĐ`,
      `Tổng giá bán: ${totalSelling.toLocaleString("vi-VN")} VNĐ`,
    ].join("\n")

    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `suggested-parts-${recordId}.txt`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({ title: "Đã xuất file" })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Linh kiện Technician đề xuất (cho Staff tạo Detail)
          </DialogTitle>
          <DialogDescription>
            Danh sách tất cả linh kiện được Technician đề xuất từ checklist. Staff xem để tạo Service Detail và chốt đơn.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px]">
          {loading ? (
            <div className="text-muted-foreground p-4">Đang tải...</div>
          ) : parts.length === 0 ? (
            <div className="text-muted-foreground p-4">Chưa có linh kiện nào được đề xuất.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên linh kiện</TableHead>
                    <TableHead className="text-center">Số lượng</TableHead>
                    <TableHead className="text-right">Giá vốn/cái</TableHead>
                    <TableHead className="text-right">Giá bán/cái</TableHead>
                    <TableHead className="text-right">Tổng giá bán</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parts.map((part) => {
                    const partData = typeof part.part_id === 'object' ? part.part_id : null
                    const partName = partData?.name || 'Unknown Part'
                    const costPrice = partData?.cost_price || 0
                    const sellingPrice = partData?.selling_price || 0
                    
                    return (
                      <TableRow key={part._id}>
                        <TableCell className="font-medium">{partName}</TableCell>
                        <TableCell className="text-center">{part.quantity}</TableCell>
                        <TableCell className="text-right">
                          {costPrice.toLocaleString("vi-VN")} VNĐ
                        </TableCell>
                        <TableCell className="text-right">
                          {sellingPrice.toLocaleString("vi-VN")} VNĐ
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {(sellingPrice * part.quantity).toLocaleString("vi-VN")} VNĐ
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className="border-t mt-4 pt-4 space-y-2 px-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tổng giá vốn:</span>
                  <span className="font-medium">{totalCost.toLocaleString("vi-VN")} VNĐ</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng giá bán:</span>
                  <span className="text-primary">{totalSelling.toLocaleString("vi-VN")} VNĐ</span>
                </div>
              </div>
            </>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2">
          {parts.length > 0 && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Xuất file
            </Button>
          )}
          <Button variant="outline" onClick={() => setOpen(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
