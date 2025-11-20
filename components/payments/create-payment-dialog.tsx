"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getApiClient, type ServiceRecordRecord, type PaymentRecord } from "@/lib/api"
import { toast } from "sonner"
import { PaymentDetailDialog } from "@/components/payments/payment-detail-dialog"
import { ExternalLink } from "lucide-react"
import { formatVND } from "@/lib/utils"

interface Props {
  record: ServiceRecordRecord
  trigger?: React.ReactNode
  onCreated?: (payment: PaymentRecord) => void
}

export function CreatePaymentDialog({ record, trigger, onCreated }: Props) {
  const api = useMemo(() => getApiClient(), [])
  
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState<number>(0)
  const [description, setDescription] = useState<string>("Payment for service")
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<PaymentRecord | null>(null)
  const [needCustomerId, setNeedCustomerId] = useState(false)
  const [customerIdManual, setCustomerIdManual] = useState<string>("")

  const resolveCustomerId = useCallback(async (): Promise<string | undefined> => {
    try {
      const aptRef: any = record.appointment_id
      if (aptRef && typeof aptRef === 'object') {
        const cust = (aptRef as any).customer_id
        if (typeof cust === 'string') return cust
        if (cust && typeof cust === 'object' && cust._id) return cust._id as string
      }
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

  const loadSuggestedAmount = useCallback(async () => {
    try {
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
      toast.error("Invalid amount")
      return
    }
    try {
      setCreating(true)
      const autoId = await resolveCustomerId()
      const customerId = autoId || (customerIdManual.trim() || undefined)
      if (!customerId) {
        setNeedCustomerId(true)
        toast.error("Missing customer information", { description: "Please enter Customer ID or link an appointment with a customer." })
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

    } catch (e: any) {
      toast.error("Create payment failed", { description: e?.message || "Create payment error" })
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
          <DialogTitle>Create Payment Request</DialogTitle>
          <DialogDescription>
            Applicable when the Service Record is completed and the customer has not paid.
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="space-y-4">
            <div className="text-sm">Created order <span className="font-semibold">#{created.order_code}</span> with amount <span className="font-semibold">{formatVND(created.amount)}</span></div>
            <div className="flex items-center gap-2">
              {created.payment_url ? (
                <Button asChild size="sm" variant="secondary" title="Open payment link">
                  <a href={created.payment_url} target="_blank" rel="noreferrer">
                    Open payment link <ExternalLink className="h-4 w-4 ml-2" />
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
                <Label>Amount (VND) *</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} min={0} />
                <p className="text-xs text-muted-foreground">Automatically calculated from service details if available</p>
              </div>
              <div className="grid gap-2">
                <Label>Description *</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="E.g., Maintenance service payment" />
              </div>
              {needCustomerId && (
                <div className="grid gap-2">
                  <Label>Customer ID *</Label>
                  <Input value={customerIdManual} onChange={(e) => setCustomerIdManual(e.target.value)} placeholder="Enter Customer ID if it cannot be determined from the appointment" />
                  <p className="text-xs text-muted-foreground">The system requires a customer_id. If the record is not linked to an appointment with a customer, please enter it manually.</p>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {!created ? (
            <Button onClick={submit} disabled={creating}>{creating ? "Creating..." : "Create Payment"}</Button>
          ) : (
            <Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
