"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { getApiClient, type PaymentRecord } from "@/lib/api"
import { useAuth, useIsAdmin, useIsStaff } from "@/components/auth-provider"
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
import { DataPagination } from "@/components/ui/data-pagination"
import { toast } from "sonner"

export default function PaymentsPage() {
  const isAdmin = useIsAdmin()
  const isStaff = useIsStaff()
  const api = useMemo(() => getApiClient(), [])
const { user } = useAuth()
  const [items, setItems] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelCode, setCancelCode] = useState<number | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const limit = 20

  const load = useCallback(async (page: number) => {
    try {
      setLoading(true)
      const params: any = { page, limit }
      
      // Filter by user's center for non-admin
      if (user?.role !== 'Admin' && user?.centerId) {
        params.center_id = user.centerId
      }
      
      const res = await api.getPayments(params)
      setItems(res.data.payments)
      setTotalItems(res.data.total || res.data.payments.length)
      setTotalPages(Math.ceil((res.data.total || res.data.payments.length) / limit))
    } catch (e: any) {
      toast.error(e?.message || "Failed to load payments")
    } finally {
      setLoading(false)
    }
  }, [api, toast])

  useEffect(() => { load(currentPage) }, [load, currentPage])

  if (!isAdmin && !isStaff) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground">Access Denied</h2>
          <p className="text-muted-foreground mt-2">This page is for Admin or Staff only.</p>
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
        toast.success("Transaction cancelled successfully")
        await load(currentPage)
      } else {
        toast.error(res.message || "Unknown error")
      }
    } catch (e: any) {
      toast.error(e?.message || "Cancel error")
    } finally {
      setCancelCode(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Admins/Staff can view and cancel transactions as needed.</p>
        </div>
        <div className="flex items-center gap-2">
          <CreatePaymentManualDialog onCreated={() => load(currentPage)} />
          <Button variant="outline" onClick={() => load(currentPage)}>
            <RotateCcw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Spinner /> Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-muted-foreground">No transactions yet.</div>
          ) : (
            <>
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
                        <Button size="sm" variant="ghost" asChild title="Open payment link">
                          <a href={p.payment_url} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <PaymentDetailDialog payment={p} trigger={<Button size="sm" variant="ghost" title="View details"><Eye className="h-4 w-4" /></Button>} />
                      {canCancel(p) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" disabled={cancelCode === p.order_code}>Cancel</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm cancel transaction?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel order #{p.order_code}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Close</AlertDialogCancel>
                              <AlertDialogAction onClick={() => doCancel(p.order_code)} disabled={cancelCode === p.order_code}>
                                {cancelCode === p.order_code ? "Cancelling..." : "Cancel transaction"}
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
            
            <div className="mt-4">
              <DataPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
