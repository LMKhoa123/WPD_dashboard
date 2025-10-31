"use client"

import React, { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getApiClient, type PaymentRecord } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { PaymentDetailDialog } from "./payment-detail-dialog"
import { ExternalLink } from "lucide-react"

interface Props {
  trigger?: React.ReactNode
  onCreated?: (p: PaymentRecord) => void
}

export function CreatePaymentManualDialog({ trigger, onCreated }: Props) {
  const api = useMemo(() => getApiClient(), [])
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<"service_record" | "subscription">("service_record")
  const [refId, setRefId] = useState("")
  const [amount, setAmount] = useState<number>(0)
  const [description, setDescription] = useState<string>("")
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<PaymentRecord | null>(null)

  const getReturnUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `${origin}/payments?payment=success`
  }
  const getCancelUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `${origin}/payments?payment=cancelled`
  }

  const submit = async () => {
    if (!refId || !amount || amount <= 0) {
      toast({ title: "Thiếu dữ liệu", description: "Nhập ID tham chiếu và số tiền hợp lệ", variant: "destructive" })
      return
    }
    try {
      setCreating(true)
      const payload: any = {
        amount,
        description: description || (type === 'service_record' ? 'Payment for service record' : 'Payment for subscription'),
        payment_type: type,
        returnUrl: getReturnUrl(),
        cancelUrl: getCancelUrl(),
      }
      if (type === 'service_record') payload.service_record_id = refId
      else payload.subscription_id = refId
      const payment = await api.createPayment(payload)
      setCreated(payment)
      onCreated?.(payment)
      toast({ title: "Đã tạo yêu cầu thanh toán", description: `Order #${payment.order_code}` })
    } catch (e: any) {
      toast({ title: "Tạo thanh toán thất bại", description: e?.message || "Create payment error", variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="secondary">Tạo thanh toán</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo thanh toán thủ công</DialogTitle>
          <DialogDescription>Chọn loại và nhập ID tham chiếu</DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="space-y-4">
            <div className="text-sm">Đã tạo order <span className="font-semibold">#{created.order_code}</span> với số tiền <span className="font-semibold">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(created.amount)}</span></div>
            <div className="flex items-center gap-2">
              {created.payment_url ? (
                <Button asChild size="sm" variant="secondary" title="Mở đường dẫn thanh toán">
                  <a href={created.payment_url} target="_blank" rel="noreferrer">
                    Mở link thanh toán <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              ) : null}
              <PaymentDetailDialog payment={created} />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="grid gap-2">
                <Label>Loại thanh toán *</Label>
                <Select value={type} onValueChange={(v) => setType(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service_record">Service Record</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{type === 'service_record' ? 'Service Record ID' : 'Subscription ID'} *</Label>
                <Input value={refId} onChange={(e) => setRefId(e.target.value)} placeholder={type === 'service_record' ? 'e.g. 64f...' : 'e.g. 64f...'} />
              </div>
              <div className="grid gap-2">
                <Label>Số tiền (VND) *</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} min={0} />
              </div>
              <div className="grid gap-2">
                <Label>Mô tả</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ghi chú thanh toán" />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {!created ? (
            <Button onClick={submit} disabled={creating}>{creating ? "Đang tạo..." : "Tạo thanh toán"}</Button>
          ) : (
            <Button variant="secondary" onClick={() => setOpen(false)}>Đóng</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
