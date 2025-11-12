"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { getApiClient, type PaymentRecord } from "@/lib/api"
import { useIsAdmin, useIsStaff } from "@/components/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, Eye, RotateCcw } from "lucide-react"
import { PaymentDetailDialog } from "@/components/payments/payment-detail-dialog"
import { CreatePaymentManualDialog } from "@/components/payments/create-payment-manual-dialog"
import { Spinner } from "@/components/ui/spinner"
import { formatVND, formatDateTime } from "@/lib/utils"

export default function PaymentsPage() {
  const isAdmin = useIsAdmin()
  const isStaff = useIsStaff()
  const { toast } = useToast()
  const api = useMemo(() => getApiClient(), [])

  const [items, setItems] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelCode, setCancelCode] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getPayments({ limit: 100 })
      setItems(res.data.payments)
    } catch (e: any) {
      toast({ title: "Không tải được danh sách thanh toán", description: e?.message || "Failed to load payments", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [api, toast])

  useEffect(() => { load() }, [load])

  if (!isAdmin && !isStaff) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground">Access Denied</h2>
          <p className="text-muted-foreground mt-2">Trang này chỉ dành cho Quản trị hoặc Nhân viên.</p>
        </div>
      </div>
    )
  }

  const statusBadge = (s: string) => {
    const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      paid: "default",
      cancelled: "destructive",
    }
    return <Badge variant={map[s] || "outline"}>{s}</Badge>
  }

  const canCancel = (p: PaymentRecord) => p.status?.toLowerCase?.() === "pending"

  const doCancel = async (orderCode: number) => {
    try {
      setCancelCode(orderCode)
      const res = await api.cancelPayment(orderCode)
      if (res.success) {
        toast({ title: "Đã hủy giao dịch", description: `Order ${orderCode} đã được hủy.` })
        // Refresh list
        await load()
      } else {
        toast({ title: "Hủy thất bại", description: res.message || "Unknown error", variant: "destructive" })
      }
    } catch (e: any) {
      toast({ title: "Hủy thất bại", description: e?.message || "Cancel error", variant: "destructive" })
    } finally {
      setCancelCode(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Admin/Staff có thể xem và hủy giao dịch khi cần</p>
        </div>
        <div className="flex items-center gap-2">
          <CreatePaymentManualDialog onCreated={() => load()} />
          <Button variant="outline" onClick={load}>
            <RotateCcw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách thanh toán</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Spinner /> Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-muted-foreground">Chưa có giao dịch.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell className="font-medium">{p.order_code}</TableCell>
                    <TableCell className="uppercase text-xs">{p.payment_type || '—'}</TableCell>
                    <TableCell className="text-right">{formatVND(p.amount)}</TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
                    <TableCell>{formatDateTime(p.createdAt)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {p.payment_url && (
                        <Button size="sm" variant="ghost" asChild title="Mở link thanh toán">
                          <a href={p.payment_url} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <PaymentDetailDialog payment={p} trigger={<Button size="sm" variant="ghost" title="Xem chi tiết"><Eye className="h-4 w-4" /></Button>} />
                      {canCancel(p) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" disabled={cancelCode === p.order_code}>Hủy</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xác nhận hủy giao dịch?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn chắc chắn muốn hủy order #{p.order_code}? Hành động này không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Đóng</AlertDialogCancel>
                              <AlertDialogAction onClick={() => doCancel(p.order_code)} disabled={cancelCode === p.order_code}>
                                {cancelCode === p.order_code ? "Đang hủy..." : "Hủy giao dịch"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
