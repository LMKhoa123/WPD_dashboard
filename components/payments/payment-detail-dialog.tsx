"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"
import { getApiClient, type PaymentInfoResponse, type PaymentRecord } from "@/lib/api"
import { Spinner } from "@/components/ui/spinner"
import { formatVND, formatDateTime } from "@/lib/utils"

interface Props {
  payment: PaymentRecord
  trigger?: React.ReactNode
}

export function PaymentDetailDialog({ payment, trigger }: Props) {
  const api = useMemo(() => getApiClient(), [])
  const [open, setOpen] = useState(false)
  const [info, setInfo] = useState<PaymentInfoResponse["data"] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadInfo = async () => {
      if (!open) return
      try {
        setLoading(true)
        setError(null)
        const res = await api.getPaymentInfoByOrderCode(payment.order_code)
        setInfo(res.data)
      } catch (e: any) {
        setError(e?.message || "Failed to load payment information from PayOS")
      } finally {
        setLoading(false)
      }
    }
    loadInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, api, payment.order_code])

  const statusBadge = (s: string) => {
    const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      PENDING: "secondary",
      paid: "default",
      PAID: "default",
      cancelled: "destructive",
      CANCELLED: "destructive",
      failed: "destructive",
      FAILED: "destructive",
    }
    return <Badge variant={map[s] || "outline"}>{s}</Badge>
  }

  const relateLabel = () => {
    if (payment.payment_type === "subscription" && payment.subscription_id && typeof payment.subscription_id === "object") {
      const sub = payment.subscription_id
      const v = (sub as any).vehicleId
      const pkg = (sub as any).package_id
      return (
        <div className="text-sm text-muted-foreground">
          Gói: {pkg?.name || (typeof pkg === 'string' ? pkg : "—")} • Xe: {v?.vehicleName || (typeof v === 'string' ? v : "—")}
        </div>
      )
    }
    if (payment.payment_type === "service_record" && payment.service_record_id) {
      const id = typeof payment.service_record_id === 'string' ? payment.service_record_id : payment.service_record_id._id
      return <div className="text-sm text-muted-foreground">Service Record: {id}</div>
    }
    if (!payment.payment_type && payment.appointment_id) {
      const id = typeof payment.appointment_id === 'string' ? payment.appointment_id : payment.appointment_id._id
      return <div className="text-sm text-muted-foreground">Appointment: {id}</div>
    }
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="ghost" title="View Details">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Payment #{payment.order_code}</DialogTitle>
          <DialogDescription>Transaction details and payment system status</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Type</div>
                <div className="text-base font-semibold">{payment.payment_type || 'N/A'}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Amount</div>
                <div className="text-base font-semibold text-primary">{formatVND(payment.amount)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="text-base font-semibold">{statusBadge(payment.status)}</div>
              </CardContent>
            </Card>
          </div>

          {relateLabel()}

          <div className="text-sm text-muted-foreground flex items-center gap-2">
            Payment Link:
            {payment.payment_url ? (
              <a className="text-primary underline" href={payment.payment_url} target="_blank" rel="noreferrer">Open PayOS</a>
            ) : (
              <span>—</span>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">PayOS</div>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Spinner /> Loading information...</div>
            ) : error ? (
              <div className="text-destructive text-sm">{error}</div>
            ) : info ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6 space-y-1">
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div>{statusBadge(info.status)}</div>
                    <div className="text-sm text-muted-foreground">Created At</div>
                    <div>{formatDateTime(info.createdAt)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 space-y-1">
                    <div className="text-sm text-muted-foreground">Paid</div>
                    <div>{formatVND(info.amountPaid)} / {formatVND(info.amount)}</div>
                    <div className="text-sm text-muted-foreground">Remaining</div>
                    <div>{formatVND(info.amountRemaining)}</div>
                  </CardContent>
                </Card>
                {info.canceledAt && (
                  <Card className="md:col-span-2">
                    <CardContent className="pt-6 space-y-1">
                      <div className="text-sm text-muted-foreground">Canceled At</div>
                      <div>{formatDateTime(info.canceledAt)}</div>
                      {info.cancellationReason && (
                        <div className="text-sm text-muted-foreground">Reason: <span className="text-foreground">{info.cancellationReason}</span></div>
                      )}
                    </CardContent>
                  </Card>
                )}
                <Card className="md:col-span-2">
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-2">Raw JSON</div>
                    <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-64">{JSON.stringify(info, null, 2)}</pre>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No data available</div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <div>Created At: {formatDateTime(payment.createdAt)}</div>
            <div>Updated At: {formatDateTime(payment.updatedAt)}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
