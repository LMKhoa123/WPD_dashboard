"use client"

import React, { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getApiClient, type PaymentRecord } from "@/lib/api"
import { toast } from "sonner"
import { PaymentDetailDialog } from "./payment-detail-dialog"
import { ExternalLink } from "lucide-react"
import { formatVND } from "@/lib/utils"

interface Props {
  trigger?: React.ReactNode
  onCreated?: (p: PaymentRecord) => void
}

export function CreatePaymentManualDialog({ trigger, onCreated }: Props) {
  const api = useMemo(() => getApiClient(), [])
  
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<"service_record" | "subscription">("service_record")
  const [refId, setRefId] = useState("")
  const [amount, setAmount] = useState<number>(0)
  const [description, setDescription] = useState<string>("")
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<PaymentRecord | null>(null)
  const [customerIdInput, setCustomerIdInput] = useState<string>("")

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
      toast.error("Missing data", { description: "Enter a valid reference ID and amount" })
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
      if (type === 'service_record') {
        payload.service_record_id = refId
        if (customerIdInput) {
          payload.customer_id = customerIdInput
        } else {
          try {
            const rec = await api.getServiceRecordById(refId)
            const aptRef: any = rec.appointment_id
            if (aptRef && typeof aptRef === 'object') {
              const cust = (aptRef as any).customer_id
              if (typeof cust === 'string') payload.customer_id = cust
              else if (cust && typeof cust === 'object' && cust._id) payload.customer_id = cust._id
            } else if (typeof aptRef === 'string') {
              const ap = await api.getAppointmentById(aptRef)
              const cust = (ap as any).customer_id
              if (typeof cust === 'string') payload.customer_id = cust
              else if (cust && typeof cust === 'object' && cust._id) payload.customer_id = cust._id
            }
          } catch {
          }
        }
      }
      else payload.subscription_id = refId
  const paymentRes = await api.createPayment(payload)
  setCreated(paymentRes.payment)
  onCreated?.(paymentRes.payment)
  toast.success("Created payment request", { description: `Order #${paymentRes.payment.order_code}` })
    } catch (e: any) {
      toast.error("Create payment failed", { description: e?.message || "Create payment error" })
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="secondary">Create Payment</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Manual Payment</DialogTitle>
          <DialogDescription>Select type and enter reference ID</DialogDescription>
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
                <Label>Payment Type *</Label>
                <Select value={type} onValueChange={(v) => setType(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
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
              {type === 'service_record' && (
                <div className="grid gap-2">
                  <Label>Customer ID (optional)</Label>
                  <Input value={customerIdInput} onChange={(e) => setCustomerIdInput(e.target.value)} placeholder="If left blank, the system will try to infer from Service Record" />
                </div>
              )}
              <div className="grid gap-2">
                <Label>Amount (VND) *</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} min={0} />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Payment notes" />
              </div>
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
