"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getApiClient, type ServiceRecordRecord, type PaymentRecord } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { PaymentDetailDialog } from "@/components/payments/payment-detail-dialog"
import { ExternalLink } from "lucide-react"

interface Props {
  record: ServiceRecordRecord
  trigger?: React.ReactNode
  onCreated?: (payment: PaymentRecord) => void
}

export function CreatePaymentDialog({ record, trigger, onCreated }: Props) {
  const api = useMemo(() => getApiClient(), [])
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState<number>(0)
  const [description, setDescription] = useState<string>("Payment for service")
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<PaymentRecord | null>(null)
  // Manual fallback when we cannot resolve customer from appointment
  const [needCustomerId, setNeedCustomerId] = useState(false)
  const [customerIdManual, setCustomerIdManual] = useState<string>("")

  // Auto-fill customer ID & URLs (hidden from user)
  // Try to resolve customer id from record -> appointment
  const resolveCustomerId = useCallback(async (): Promise<string | undefined> => {
    try {
      const aptRef: any = record.appointment_id
      // If appointment embedded as object
      if (aptRef && typeof aptRef === 'object') {
        const cust = (aptRef as any).customer_id
        if (typeof cust === 'string') return cust
        if (cust && typeof cust === 'object' && cust._id) return cust._id as string
      }
      // If appointment is just an id string, fetch it
      if (typeof aptRef === 'string') {
        const ap = await api.getAppointmentById(aptRef)
        const cust = (ap as any).customer_id
        if (typeof cust === 'string') return cust
        if (cust && typeof cust === 'object' && cust._id) return cust._id as string
      }
    } catch {
      // ignore
    }
    return undefined
  }, [api, record.appointment_id])

  const getReturnUrl = useCallback(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `${origin}/service-records?payment=success`
  }, [])

  const getCancelUrl = useCallback(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `${origin}/service-records?payment=cancelled`
  }, [])

  // Load and sum service details to suggest amount
  const loadSuggestedAmount = useCallback(async () => {
    try {
      // reuse getServiceDetails with record_id filter
      const res = await api.getServiceDetails({ record_id: record._id, limit: 500 })
      const sum = (res.data.details || []).reduce((acc, d) => acc + (d.quantity * d.unit_price), 0)
      if (sum > 0) setAmount(sum)
    } catch {
      // ignore
    }
  }, [api, record._id])

  useEffect(() => { if (open) loadSuggestedAmount() }, [open, loadSuggestedAmount])

  const submit = async () => {
    if (!amount || amount <= 0) {
      toast({ title: "Số tiền không hợp lệ", variant: "destructive" })
      return
    }
    try {
      setCreating(true)
      const autoId = await resolveCustomerId()
      const customerId = autoId || (customerIdManual.trim() || undefined)
      if (!customerId) {
        // Ask user to input manually
        setNeedCustomerId(true)
        toast({ title: "Thiếu thông tin khách hàng", description: "Vui lòng nhập Customer ID hoặc gắn lịch hẹn có khách hàng.", variant: "destructive" })
        setCreating(false)
        return
      }
      const payment = await api.createPayment({
        service_record_id: record._id,
        customer_id: customerId,
        amount,
        description,
        payment_type: "service_record",
        returnUrl: getReturnUrl(),
        cancelUrl: getCancelUrl(),
      })
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
        {trigger || <Button size="sm" variant="outline">Create Payment</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo yêu cầu thanh toán</DialogTitle>
          <DialogDescription>
            Áp dụng khi Service Record đã completed và khách chưa thanh toán.
          </DialogDescription>
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
                <Label>Số tiền (VND) *</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} min={0} />
                <p className="text-xs text-muted-foreground">Tự động tính từ chi tiết dịch vụ nếu có</p>
              </div>
              <div className="grid gap-2">
                <Label>Mô tả *</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ví dụ: Thanh toán dịch vụ bảo dưỡng" />
              </div>
              {needCustomerId && (
                <div className="grid gap-2">
                  <Label>Customer ID *</Label>
                  <Input value={customerIdManual} onChange={(e) => setCustomerIdManual(e.target.value)} placeholder="Nhập Customer ID khi không tự xác định được từ lịch hẹn" />
                  <p className="text-xs text-muted-foreground">Hệ thống yêu cầu customer_id. Nếu record chưa gắn appointment có khách hàng, vui lòng nhập thủ công.</p>
                </div>
              )}
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
