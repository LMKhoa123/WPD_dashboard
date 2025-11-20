"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getApiClient, type SuggestedPartItem } from "@/lib/api"
import { toast } from "sonner"
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
  const api = useMemo(() => getApiClient(), [])

  useEffect(() => {
    if (!open) return
    const run = async () => {
      try {
        setLoading(true)
        const res = await api.getAllSuggestedParts(recordId)
        setParts(res.data || [])
      } catch (e: any) {
        toast.error(e?.message || "Failed to load suggested parts")
        setParts([])
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
    const text = [
      "LIST OF SUGGESTED REPLACEMENT PARTS",
      "=" .repeat(60),
      "",
      ...parts.map(part => {
        const partData = typeof part.part_id === 'object' ? part.part_id : null
        const partName = partData?.name || 'Unknown Part'
        const costPrice = partData?.cost_price || 0
        const sellingPrice = partData?.selling_price || 0
        
        return `${partName}\n` +
          `  Quantity: ${part.quantity}\n` +
          `  Cost Price: ${costPrice.toLocaleString("vi-VN")} VND/unit\n` +
          `  Selling Price: ${sellingPrice.toLocaleString("vi-VN")} VND/unit\n` +
          `  Total Selling Price: ${(sellingPrice * part.quantity).toLocaleString("vi-VN")} VND\n`
      }),
      "",
      "=" .repeat(60),
      `Total Cost: ${totalCost.toLocaleString("vi-VN")} VND`,
      `Total Selling Price: ${totalSelling.toLocaleString("vi-VN")} VND`,
    ].join("\n")

    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `suggested-parts-${recordId}.txt`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success("File exported")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Suggested Parts by Technician (for Staff to create Service Detail)
          </DialogTitle>
          <DialogDescription>
            List of all parts suggested by the Technician from the checklist. Staff can review to create Service Detail and finalize the order.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px]">
          {loading ? (
            <div className="text-muted-foreground p-4">Loading...</div>
          ) : parts.length === 0 ? (
            <div className="text-muted-foreground p-4">No parts have been suggested yet.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Name</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Cost Price/unit</TableHead>
                    <TableHead className="text-right">Selling Price/unit</TableHead>
                    <TableHead className="text-right">Total Selling Price</TableHead>
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
                  <span className="text-muted-foreground">Total Cost:</span>
                  <span className="font-medium">{totalCost.toLocaleString("vi-VN")} VND</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Selling Price:</span>
                  <span className="text-primary">{totalSelling.toLocaleString("vi-VN")} VND</span>
                </div>
              </div>
            </>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2">
          {parts.length > 0 && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export file
            </Button>
          )}
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
