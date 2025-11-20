"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"
import { getApiClient, type InvoiceRecord, type PaymentRecord, type ServiceDetailRecord, type VehicleSubscriptionRecord } from "@/lib/api"
import { Spinner } from "@/components/ui/spinner"
import { formatVND, formatDateTime } from "@/lib/utils"

interface Props {
    invoice: InvoiceRecord
    trigger?: React.ReactNode
}

export function InvoiceDetailDialog({ invoice, trigger }: Props) {
    const api = useMemo(() => getApiClient(), [])
    const [open, setOpen] = useState(false)
    const [fullInvoice, setFullInvoice] = useState<InvoiceRecord>(invoice)
    const [payment, setPayment] = useState<PaymentRecord | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadData = async () => {
            if (!open) return
            try {
                setLoading(true)
                setError(null)

                // Load full invoice with related data (service details or subscription)
                const invoiceData = await api.getInvoiceById(invoice._id)
                setFullInvoice(invoiceData)
            } catch (e: any) {
                setError(e?.message || "Failed to load invoice details")
            } finally {
                setLoading(false)
            }
        }
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, api, invoice._id])

    const statusBadge = (s: string) => {
        const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            pending: "secondary",
            issued: "default",
            cancelled: "destructive",
        }
        return <Badge variant={map[s] || "outline"}>{s}</Badge>
    }

    const typeLabel = (t: string) => {
        return t === "Subscription Package" ? "Subscription Package" : "Service Completion"
    }

    const calculateOriginalAmount = () => {
        // totalAmount is the FINAL amount (after discount)
        // minusAmount is the discount percentage
        // originalAmount = finalAmount / (1 - discountPercent/100)
        if (fullInvoice.minusAmount === 0) return fullInvoice.totalAmount
        return Math.round(fullInvoice.totalAmount / (1 - fullInvoice.minusAmount / 100))
    }

    const originalAmount = calculateOriginalAmount()
    const discountAmount = originalAmount - fullInvoice.totalAmount

    // Check if data is a service detail array or subscription object
    const isServiceDetails = Array.isArray(fullInvoice.data)
    const isSubscription = fullInvoice.data && !Array.isArray(fullInvoice.data)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-2xl">INVOICE</DialogTitle>
                            <DialogDescription className="mt-1">
                                Invoice ID: {fullInvoice._id}
                            </DialogDescription>
                        </div>
                        {statusBadge(fullInvoice.status)}
                    </div>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Spinner />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-700 p-4 rounded">
                        <p className="font-semibold">Lỗi</p>
                        <p className="text-sm">{error}</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div className="grid grid-cols-3 gap-4 text-sm border-b pb-4">
                            <div>
                                <p className="text-muted-foreground text-xs font-semibold mb-1">Invoice Date</p>
                                <p className="font-medium">{formatDateTime(fullInvoice.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs font-semibold mb-1">Service Type</p>
                                <p className="font-medium">{typeLabel(fullInvoice.invoiceType)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs font-semibold mb-1">Invoice Status</p>
                                <p className="font-medium">{fullInvoice.status.toUpperCase()}</p>
                            </div>
                        </div>

                        {/* Items Table for Service Details */}
                        {isServiceDetails && fullInvoice.data && (
                            <div>
                                <h3 className="font-semibold mb-3">Service Items</h3>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100 border-b">
                                            <tr>
                                                <th className="text-left px-4 py-3 font-semibold text-xs">Item Description</th>
                                                <th className="text-center px-4 py-3 font-semibold text-xs w-16">Qty</th>
                                                <th className="text-right px-4 py-3 font-semibold text-xs w-24">Unit Price</th>
                                                <th className="text-right px-4 py-3 font-semibold text-xs w-28">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(fullInvoice.data as ServiceDetailRecord[]).map((detail, idx) => {
                                                const centerPart = typeof detail.centerpart_id === 'object' ? detail.centerpart_id : null
                                                const part = centerPart && typeof centerPart.part_id === 'object' ? centerPart.part_id : null
                                                const itemTotal = detail.totalPrice || detail.quantity * detail.unit_price
                                                return (
                                                    <tr key={detail._id || idx} className="border-b hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <p className="font-medium">{part?.name || "—"}</p>
                                                            <p className="text-xs text-muted-foreground">{detail.description}</p>
                                                        </td>
                                                        <td className="text-center px-4 py-3">{detail.quantity}</td>
                                                        <td className="text-right px-4 py-3">{formatVND(detail.unit_price)}</td>
                                                        <td className="text-right px-4 py-3 font-medium">{formatVND(itemTotal)}</td>
                                                    </tr>
                                                )
                                            })}
                                            {/* Labor Fee Row */}
                                            <tr className="border-b bg-blue-50 hover:bg-blue-100">
                                                <td className="px-4 py-3">
                                                    <p className="font-medium">Labor Fee</p>
                                                </td>
                                                <td className="text-center px-4 py-3">1</td>
                                                <td className="text-right px-4 py-3">{formatVND(200000)}</td>
                                                <td className="text-right px-4 py-3 font-medium">{formatVND(200000)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Subscription Package Display */}
                        {isSubscription && fullInvoice.data && (
                            <div className="border rounded-lg p-4 bg-gray-50">
                                {(() => {
                                    const subscription = fullInvoice.data as VehicleSubscriptionRecord
                                    const vehicle = typeof subscription.vehicleId === 'object' ? subscription.vehicleId : null
                                    const package_info = typeof subscription.package_id === 'object' ? subscription.package_id : null

                                    return (
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground font-semibold mb-2">SUBSCRIPTION PACKAGE</p>
                                                <p className="text-lg font-bold">{package_info?.name || "—"}</p>
                                                <p className="text-sm text-muted-foreground mt-1">{package_info?.description || "—"}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-muted-foreground font-semibold">Vehicle</p>
                                                    <p className="font-medium">{vehicle?.vehicleName} ({vehicle?.model})</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground font-semibold">Duration</p>
                                                    <p className="font-medium">{package_info?.duration || 0} months</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>
                        )}

                        {/* Calculation Summary */}
                        <div className="border-t pt-4">
                            <div className="ml-auto w-80 space-y-3">
                                {/* Subtotal for service details */}
                                {isServiceDetails && fullInvoice.data && (
                                    <>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Subtotal (Parts)</span>
                                            <span>{formatVND(Math.round(originalAmount - 200000))}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Labor Fee</span>
                                            <span>{formatVND(200000)}</span>
                                        </div>
                                    </>
                                )}

                                {/* Total before discount */}
                                <div className="flex justify-between items-center text-sm border-t pt-3">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium">{formatVND(originalAmount)}</span>
                                </div>

                                {/* Discount if applicable */}
                                {fullInvoice.minusAmount > 0 && (
                                    <div className="flex justify-between items-center text-sm text-green-600">
                                        <span>Discount ({fullInvoice.minusAmount}%)</span>
                                        <span className="font-medium">-{formatVND(discountAmount)}</span>
                                    </div>
                                )}

                                {/* Final Amount */}
                                <div className="flex justify-between items-center text-lg font-bold bg-blue-50 p-3 rounded border-2 border-blue-200">
                                    <span>TOTAL AMOUNT</span>
                                    <span className="text-blue-600">{formatVND(fullInvoice.totalAmount)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
