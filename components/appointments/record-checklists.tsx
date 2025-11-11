"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { getApiClient, type RecordChecklistsListResponse } from "@/lib/api"
import { CheckCircle2, CircleDashed, Info, ListChecks, StickyNote, Wallet } from "lucide-react"

export interface RecordChecklistsProps {
    recordId: string
}

// Map possible checklist statuses to badge styles
const statusBadge: Record<string, string> = {
    completed: "bg-green-500/10 text-green-600 border-green-500/20",
    ok: "bg-green-500/10 text-green-600 border-green-500/20",
    checked: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    "in-progress": "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    "needs-replacement": "bg-red-500/10 text-red-600 border-red-500/20",
}

export function RecordChecklists({ recordId }: RecordChecklistsProps) {
    const api = useMemo(() => getApiClient(), [])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [items, setItems] = useState<RecordChecklistsListResponse["data"]>([])

    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                setLoading(true)
                setError(null)
                const res = await api.getRecordChecklistsByRecord(recordId)
                if (!mounted) return
                setItems(res.data || [])
            } catch (e: any) {
                if (!mounted) return
                setError(e?.message || "Không thể tải checklist")
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [api, recordId])

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground"><Spinner /> Đang tải checklist...</div>
        )
    }

    if (error) {
        return <div className="text-sm text-red-600">{error}</div>
    }

    if (!items.length) {
        return <div className="text-sm text-muted-foreground">Chưa có checklist cho bản ghi này</div>
    }

    const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)

    return (
        <Card className="border-dashed">
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <ListChecks className="h-4 w-4" />
                    Công việc hiện tại
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {items.map((it) => {
                    const checklistName = typeof (it as any).checklist_id === "object"
                        ? (it as any).checklist_id.name
                        : String((it as any).checklist_id)

                    const st = String((it as any).status || "pending").toLowerCase()
                    const badgeCls = statusBadge[st] || "bg-gray-500/10 text-gray-600 border-gray-500/20"

                    // Support both suggest: string[] and suggest: Array<{ part_id: ..., quantity?: number }>
                    const suggest = (it as any).suggest as any[] | undefined

                    return (
                        <div key={(it as any)._id} className="rounded-lg border p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="font-medium">{checklistName}</div>
                                <Badge variant="outline" className={badgeCls}>
                                    {st.replace(/-/g, " ")}
                                </Badge>
                            </div>
                            {(it as any).note && (
                                <div className="mt-2 text-sm text-muted-foreground flex items-start gap-2">
                                    <StickyNote className="h-4 w-4 mt-0.5" />
                                    {(it as any).note}
                                </div>
                            )}

                            {Array.isArray(suggest) && suggest.length > 0 && (
                                <div className="mt-3">
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
                                        <Info className="h-3.5 w-3.5" /> Đề xuất vật tư
                                    </div>
                                    <div className="grid gap-2">
                                        {suggest.map((s, idx) => {
                                            // Unwrap nested shapes safely
                                            const centerPart = (s as any).part_id || s
                                            const innerPart = typeof centerPart === 'object' ? (centerPart.part_id ?? centerPart) : undefined
                                            const name = typeof innerPart === 'object'
                                                ? (innerPart.name || innerPart._id || '—')
                                                : typeof centerPart === 'object' && centerPart.name
                                                    ? centerPart.name
                                                    : String(innerPart ?? centerPart ?? '—')
                                            const unitPrice: number | undefined = typeof innerPart === 'object'
                                                ? (innerPart.selling_price ?? innerPart.cost_price)
                                                : undefined
                                            const quantity = (s as any).quantity as number | undefined
                                            const total = unitPrice !== undefined && quantity !== undefined ? unitPrice * quantity : undefined

                                            const stockQty = typeof centerPart === 'object' ? centerPart.quantity : undefined


                                            return (
                                                <div key={idx} className="rounded border bg-muted/60 p-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="text-sm font-medium">{name}</div>
                                                        <div className="flex items-center gap-2">
                                                            {quantity !== undefined && (
                                                                <Badge variant="secondary" className="shrink-0">Số lượng nên thay : {quantity}</Badge>
                                                            )}
                                                            {total !== undefined && (
                                                                <Badge variant="outline" className="shrink-0">
                                                                    {formatCurrency(total)}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {(unitPrice !== undefined || stockQty !== undefined) && (
                                                        <div className="mt-1 text-xs text-muted-foreground flex items-center justify-between">
                                                            <div className="flex items-center gap-1">
                                                                <Wallet className="h-3.5 w-3.5" />
                                                                {unitPrice !== undefined ? <>Giá: <span className="font-medium">{formatCurrency(unitPrice)}</span></> : <span>Giá: —</span>}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}

                <Separator />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Cập nhật theo thời gian thực khi kỹ thuật viên hoàn thành các mục.
                </div>
            </CardContent>
        </Card>
    )
}

export default RecordChecklists
