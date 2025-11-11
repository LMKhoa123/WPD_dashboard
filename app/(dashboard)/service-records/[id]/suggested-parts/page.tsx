"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { getApiClient, type ServiceDetailRecord, type PaymentRecord } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, CheckCircle2, Minus, Plus, ReceiptText, ShieldCheck } from "lucide-react"

type SuggestedLine = {
    center_auto_part_id: string
    auto_part_id: string
    name: string
    selling_price: number
    center_stock: number
    total_suggested_quantity: number
    warranty_time: number
    image?: string
}

type LineState = SuggestedLine & {
    quantity: number
    confirmed: boolean
    detail?: ServiceDetailRecord
}

export default function SuggestedPartsPage() {
    const { id: recordId } = useParams() as { id: string }
    const router = useRouter()
    const api = useMemo(() => getApiClient(), [])
    const { toast } = useToast()

    const [loading, setLoading] = useState(true)
    const [lines, setLines] = useState<LineState[]>([])
    const [submittingId, setSubmittingId] = useState<string | null>(null)
    const [customerId, setCustomerId] = useState<string | null>(null)
    const [paying, setPaying] = useState(false)
    const [discountPercent, setDiscountPercent] = useState<number>(0)
    const [isPaid, setIsPaid] = useState(false)
    const [paidPayment, setPaidPayment] = useState<PaymentRecord | null>(null)

    const VND = (v: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v)

    useEffect(() => {
        const run = async () => {
            try {
                setLoading(true)
                // 1) Load existing service details first (may be present or empty)
                const detailsRes = await api.getServiceDetails({ record_id: recordId })
                const existingDetails = detailsRes?.data?.details || []
                const existingByCenterPart: Record<string, ServiceDetailRecord> = {}
                existingDetails.forEach((d: ServiceDetailRecord) => {
                    const cp = typeof d.centerpart_id === "string" ? d.centerpart_id : (d.centerpart_id as any)?._id
                    if (cp) existingByCenterPart[cp] = d
                })

                // Bootstrap confirmed lines from existing service details
                const existingLines: LineState[] = existingDetails.map((d: ServiceDetailRecord) => {
                    const centerpartId = typeof d.centerpart_id === "string" ? d.centerpart_id : (d.centerpart_id as any)?._id
                    return {
                        center_auto_part_id: centerpartId || "",
                        auto_part_id: "",
                        name: d.description || "Vật tư đã thêm",
                        selling_price: Number(d.unit_price ?? 0),
                        center_stock: 0,
                        total_suggested_quantity: 0,
                        warranty_time: 0,
                        image: undefined,
                        quantity: Number(d.quantity ?? 0),
                        confirmed: true,
                        detail: d,
                    }
                })

                // 2) Load suggested parts and merge with existing
                const res: any = await api.getAllSuggestedParts(recordId)
                const raw: SuggestedLine[] = (res?.data || []).map((x: any) => ({
                    center_auto_part_id: x.center_auto_part_id || x.centerpart_id || x.center_id || "",
                    auto_part_id: x.auto_part_id || (x.part_id?._id ?? x.part_id) || "",
                    name: x.name || x.part_id?.name || "—",
                    selling_price: Number(x.selling_price ?? x.part_id?.selling_price ?? 0),
                    center_stock: Number(x.center_stock ?? x.quantity ?? 0),
                    total_suggested_quantity: Number(x.total_suggested_quantity ?? x.quantity ?? 0),
                    warranty_time: Number(x.warranty_time ?? 0),
                    image: x.image || x.part_id?.image || "",
                }))
                const initSuggested: LineState[] = raw.map((r) => ({
                    ...r,
                    quantity: Math.max(0, Math.min(r.total_suggested_quantity || 0, r.center_stock || 0)),
                    confirmed: false,
                }))

                // Merge: keep existing confirmed lines, and add suggested ones that aren't already confirmed
                const merged: LineState[] = [...existingLines]
                for (const s of initSuggested) {
                    const existing = merged.find((m) => m.center_auto_part_id === s.center_auto_part_id)
                    if (existing) {
                        // Enrich existing confirmed line with display info if missing
                        merged.splice(merged.indexOf(existing), 1, {
                            ...existing,
                            name: existing.name && existing.name !== "Vật tư đã thêm" ? existing.name : s.name,
                            image: existing.image || s.image,
                            warranty_time: existing.warranty_time || s.warranty_time,
                            center_stock: s.center_stock || existing.center_stock,
                            // keep selling_price from detail (unit_price) for confirmed lines
                        })
                    } else {
                        merged.push(s)
                    }
                }

                setLines(merged)

                // Also resolve customerId from record -> appointment
                try {
                    const record = await api.getServiceRecordById(recordId)
                    const appt = record?.appointment_id
                        ? (typeof record.appointment_id === "string" ? await api.getAppointmentById(record.appointment_id) : record.appointment_id)
                        : null
                    const cid = appt?.customer_id
                        ? (typeof appt.customer_id === "string" ? appt.customer_id : appt.customer_id?._id)
                        : null
                    setCustomerId(cid || null)
                } catch {
                    // ignore customer resolution error
                }

                // Load active subscription package by service record to get discount percent
                try {
                    const pkg = await api.getActiveSubscriptionPackageByServiceRecord(recordId)
                    const dp = (pkg as any)?.discount_percent ?? 0
                    setDiscountPercent(Number(dp) || 0)
                } catch {
                    setDiscountPercent(0)
                }

                // Check payment status for this service record
                try {
                    const payRes = await api.getPayments({ service_record_id: recordId, limit: 50 })
                    const payments = (payRes as any)?.data?.payments || []
                    const paid = payments.find((p: any) => {
                        const s = String(p?.status || "").toLowerCase()
                        return s === "paid" || s === "completed"
                    }) as PaymentRecord | undefined
                    if (paid) {
                        setIsPaid(true)
                        setPaidPayment(paid)
                    } else {
                        setIsPaid(false)
                        setPaidPayment(null)
                    }
                } catch {
                    // if cannot fetch payments, keep default (treat as unpaid)
                    setIsPaid(false)
                }
            } catch (e: any) {
                toast({ title: "Không tải được đề xuất vật tư", description: e?.message || "Failed to load suggested parts", variant: "destructive" })
            } finally {
                setLoading(false)
            }
        }
        run()
    }, [api, recordId, toast])

    const setQty = (centerpartId: string, next: number) => {
        setLines((prev) => prev.map((l) => {
            if (l.center_auto_part_id !== centerpartId || l.confirmed) return l
            const max = l.center_stock || 0
            const clamped = Math.max(0, Math.min(next, max))
            return { ...l, quantity: clamped }
        }))
    }

    const confirmLine = async (l: LineState) => {
        if (l.confirmed || !l.quantity) return
        try {
            setSubmittingId(l.center_auto_part_id)
            const detail = await api.createServiceDetail({
                record_id: recordId,
                centerpart_id: l.center_auto_part_id,
                description: undefined as any, // backend will generate description
                quantity: l.quantity,
                unit_price: undefined as any, // backend will set
            } as any)
            setLines((prev) => prev.map((x) => x.center_auto_part_id === l.center_auto_part_id ? { ...x, confirmed: true, detail, selling_price: detail.unit_price } : x))
            toast({ title: "Đã xác nhận dòng vật tư" })
        } catch (e: any) {
            toast({ title: "Xác nhận thất bại", description: e?.message || "Failed to create service detail", variant: "destructive" })
        } finally {
            setSubmittingId(null)
        }
    }

    const removeLine = (centerpartId: string) => {
        setLines((prev) => prev.filter((l) => l.center_auto_part_id !== centerpartId))
    }

    const partsTotal = lines.filter(l => l.confirmed).reduce((sum, l) => sum + l.quantity * l.selling_price, 0)
    const labor = 200_000
    const discount = Math.round(((partsTotal + labor) * (discountPercent || 0)) / 100)
    const grandTotal = Math.max(0, partsTotal + labor - discount)
    const hasUnconfirmed = lines.some((l) => !l.confirmed)

    const createPayment = async () => {
        if (hasUnconfirmed) {
            toast({ title: "Còn dòng chưa xác nhận", description: "Vui lòng xác nhận hoặc xóa các dòng chưa xác nhận trước khi thanh toán." })
            return
        }
        if (!customerId) {
            toast({ title: "Thiếu thông tin khách hàng", description: "Không xác định được khách hàng để tạo thanh toán", variant: "destructive" })
            return
        }
        if (grandTotal <= 0) {
            toast({ title: "Số tiền không hợp lệ", description: "Tổng tiền cần lớn hơn 0" })
            return
        }
        try {
            setPaying(true)
            const currentUrl = typeof window !== "undefined" ? window.location.href : undefined
            const { payment, paymentUrl } = await api.createPayment({
                service_record_id: recordId,
                customer_id: customerId,
                amount: Math.round(grandTotal),
                description: `Thanh toán dịch vụ `,
                payment_type: "service_record",
                returnUrl: currentUrl,
                cancelUrl: currentUrl,
                // Giữ returnUrl/cancelUrl mặc định ở backend
            })
            const url = paymentUrl || (payment as any)?.payment_url
            if (url) {
                window.location.href = url as string
            } else {
                toast({ title: "Tạo thanh toán thành công", description: "Không có liên kết thanh toán, vui lòng kiểm tra danh sách thanh toán." })
            }
        } catch (e: any) {
            toast({ title: "Tạo thanh toán thất bại", description: e?.message || "Không thể tạo thanh toán", variant: "destructive" })
        } finally {
            setPaying(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground"><Spinner /> Đang tải đề xuất...</div>
        )
    }

    if (isPaid) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><ReceiptText className="h-5 w-5" /> Hóa đơn linh kiện</h1>
                            <p className="text-sm text-muted-foreground">Record: {recordId}</p>
                        </div>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={`/appointments`}>
                            Quay về lịch hẹn
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" /> Đã thanh toán
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        {paidPayment ? (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between"><span>Mã đơn</span><span className="font-medium">{paidPayment.order_code}</span></div>
                                <div className="flex items-center justify-between"><span>Số tiền</span><span className="font-semibold">{VND(paidPayment.amount)}</span></div>
                                <div className="flex items-center justify-between"><span>Trạng thái</span><Badge className="bg-green-500/10 text-green-700 border-green-500/20">{paidPayment.status}</Badge></div>
                            </div>
                        ) : null}
                        <div className="pt-3 flex items-center justify-end gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/payments">Xem danh sách thanh toán</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><ReceiptText className="h-5 w-5" /> Hóa đơn linh kiện</h1>
                        <p className="text-sm text-muted-foreground">Record: {recordId}</p>
                    </div>
                </div>
                <Button variant="outline" asChild>
                    <Link href={`/appointments`}>
                        Quay về lịch hẹn
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Danh sách vật tư</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {lines.length === 0 && (
                        <div className="text-sm text-muted-foreground">Không có đề xuất nào.</div>
                    )}
                    {lines.map((l) => {
                        const lineTotal = l.quantity * l.selling_price
                        return (
                            <div key={l.center_auto_part_id} className="rounded-lg border p-3">
                                <div className="flex items-start gap-3">
                                    {l.image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={l.image} alt={l.name} className="h-14 w-14 rounded object-cover border" />
                                    ) : (
                                        <div className="h-14 w-14 rounded bg-muted grid place-items-center text-muted-foreground">IMG</div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="truncate font-medium">{l.name}</div>
                                            <Badge variant="outline">Giá: {VND(l.selling_price)}</Badge>
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                                            <ShieldCheck className="h-3.5 w-3.5" /> Bảo hành: {l.warranty_time} ngày
                                            <span className="mx-2">•</span>
                                            Tồn kho tối đa: <span className="font-medium">{l.center_stock}</span>
                                        </div>

                                        {/* Controls */}
                                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <Button type="button" variant="outline" size="icon" disabled={l.confirmed || l.quantity <= 0} onClick={() => setQty(l.center_auto_part_id, l.quantity - 1)}>
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <Input
                                                    type="number"
                                                    className="w-24"
                                                    min={0}
                                                    max={l.center_stock}
                                                    value={l.quantity}
                                                    disabled={l.confirmed}
                                                    onChange={(e) => setQty(l.center_auto_part_id, Number(e.target.value))}
                                                />
                                                <Button type="button" variant="outline" size="icon" disabled={l.confirmed || l.quantity >= l.center_stock} onClick={() => setQty(l.center_auto_part_id, l.quantity + 1)}>
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                                <div className="text-sm text-muted-foreground">Mặc định: {l.total_suggested_quantity}</div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="text-sm font-medium">Tạm tính: {VND(lineTotal)}</div>
                                                {!l.confirmed ? (
                                                    <div className="flex items-center gap-2">
                                                        <Button size="sm" disabled={!l.quantity || submittingId === l.center_auto_part_id} onClick={() => confirmLine(l)}>
                                                            {submittingId === l.center_auto_part_id ? <Spinner className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 mr-1" />} Xác nhận
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => removeLine(l.center_auto_part_id)}>Xóa</Button>
                                                    </div>
                                                ) : (
                                                    <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Đã xác nhận</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    <Separator />
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <div>Tiền công</div>
                            <div className="font-medium">{VND(labor)}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>Giảm giá{submittingId ? null : <span className="text-muted-foreground"> {discountPercent ? `(${discountPercent}%)` : ""}</span>}</div>
                            <div className="font-medium">{VND(discount)}</div>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between text-base">
                            <div className="font-semibold">Tổng cộng</div>
                            <div className="font-bold">{VND(grandTotal)}</div>
                        </div>
                        {hasUnconfirmed ? (
                            <div className="pt-3 text-sm text-amber-600">Có {lines.filter(l => !l.confirmed).length} dòng chưa xác nhận. Vui lòng xác nhận hoặc xóa để tiếp tục thanh toán.</div>
                        ) : null}
                        <div className="pt-3 flex items-center justify-end">
                            <Button onClick={createPayment} disabled={paying || grandTotal <= 0 || !customerId || hasUnconfirmed}>
                                {paying ? <Spinner className="h-4 w-4 mr-2" /> : null}
                                Thanh toán
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
