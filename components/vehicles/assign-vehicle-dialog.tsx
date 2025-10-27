"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { getApiClient } from "@/lib/api"
import { UserPlus } from "lucide-react"

interface AssignVehicleDialogProps {
  vehicleId: string
  vehicleName: string
  trigger?: React.ReactNode
}

export function AssignVehicleDialog({ vehicleId, vehicleName, trigger }: AssignVehicleDialogProps) {
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!phone.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số điện thoại",
        variant: "destructive",
      })
      return
    }

    // Validate phone number format (Vietnamese phone number)
    const phoneRegex = /^(0|\+84)[1-9][0-9]{8,9}$/
    if (!phoneRegex.test(phone.trim())) {
      toast({
        title: "Lỗi",
        description: "Số điện thoại không hợp lệ",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const api = getApiClient()
      const result = await api.assignVehicle(vehicleId, phone.trim())
      
      if (result.success) {
        toast({
          title: "Thành công",
          description: result.message || "Đã gán xe cho khách hàng",
        })
        setOpen(false)
        setPhone("")
      } else {
        toast({
          title: "Lỗi",
          description: result.message || "Không thể gán xe",
          variant: "destructive",
        })
      }
    } catch (e: any) {
      toast({
        title: "Lỗi",
        description: e?.message || "Không thể gán xe cho khách hàng",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Gán xe
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Gán xe cho khách hàng</DialogTitle>
            <DialogDescription>
              Nhập số điện thoại của khách hàng để gán xe <strong>{vehicleName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">
                Nhập số điện thoại của khách hàng (10-11 số)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : "Gán xe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
