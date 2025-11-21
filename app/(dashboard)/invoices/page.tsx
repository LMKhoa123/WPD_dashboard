"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { getApiClient, type InvoiceRecord } from "@/lib/api"
import { useAuth, useIsAdmin, useIsStaff } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Plus } from "lucide-react"
import { InvoiceDetailDialog } from "@/components/invoices/invoice-detail-dialog"
import { Spinner } from "@/components/ui/spinner"
import { formatVND, formatDateTime } from "@/lib/utils"
import { DataPagination } from "@/components/ui/data-pagination"
import { toast } from "sonner"

export default function InvoicesPage() {
    const isAdmin = useIsAdmin()
    const isStaff = useIsStaff()
    const api = useMemo(() => getApiClient(), [])
    const { user } = useAuth()

    const [items, setItems] = useState<InvoiceRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const limit = 20

    const load = useCallback(async (page: number) => {
        try {
            setLoading(true)
            const params: any = { page, limit }

            const res = await api.getInvoices(params)
            setItems(res.data.invoices)
            setTotalItems(res.data.total || res.data.invoices.length)
            setTotalPages(Math.ceil((res.data.total || res.data.invoices.length) / limit))
        } catch (e: any) {
            toast.error(e?.message || "Failed to load invoices")
        } finally {
            setLoading(false)
        }
    }, [api])

    useEffect(() => {
        load(currentPage)
    }, [load, currentPage])

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
            issued: "default",
            cancelled: "destructive",
        }
        return <Badge variant={map[s] || "outline"}>{s}</Badge>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Invoice Management</h1>
                    <p className="text-muted-foreground">View and manage customer invoices.</p>
                </div>
                <div className="flex gap-2">
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Invoice List</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Spinner />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No invoices found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice ID</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Original Amount</TableHead>
                                        <TableHead>Discount</TableHead>
                                        <TableHead>Final Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created Date</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((invoice) => {
                                        const originalAmount = invoice.minusAmount === 0
                                            ? invoice.totalAmount
                                            : Math.round(invoice.totalAmount / (1 - invoice.minusAmount / 100))
                                        const discountAmount = originalAmount - invoice.totalAmount

                                        return (
                                            <TableRow key={invoice._id}>
                                                <TableCell className="font-mono text-sm max-w-xs truncate">
                                                    {invoice._id}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {invoice.invoiceType === "Subscription Package" ? "Subscription Package" : "Service Completion"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {formatVND(originalAmount)}
                                                </TableCell>
                                                <TableCell>
                                                    {invoice.minusAmount > 0 ? (
                                                        <span className="text-green-600 font-medium">
                                                            -{formatVND(discountAmount)} ({invoice.minusAmount}%)
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium text-primary">
                                                    {formatVND(invoice.totalAmount)}
                                                </TableCell>
                                                <TableCell>
                                                    {statusBadge(invoice.status)}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {formatDateTime(invoice.createdAt)}
                                                </TableCell>
                                                <TableCell>
                                                    <InvoiceDetailDialog
                                                        invoice={invoice}
                                                        trigger={
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        }
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex justify-center mt-6">
                            <DataPagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
