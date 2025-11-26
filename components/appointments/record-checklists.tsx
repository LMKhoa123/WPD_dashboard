"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { getApiClient, type RecordChecklistsListResponse, type ChecklistDefectItem, type IServiceOrder } from "@/lib/api"
import { CheckCircle2, Info, ListChecks, StickyNote, Wallet, Plus, Lock } from "lucide-react"

export interface RecordChecklistsProps {
    recordId: string
}

const statusBadge: Record<string, string> = {
    completed: "bg-green-500/10 text-green-600 border-green-500/20",
    ok: "bg-green-500/10 text-green-600 border-green-500/20",
    checked: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    "in-progress": "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    "needs-replacement": "bg-red-500/10 text-red-600 border-red-500/20",
}

// Sub-component to render defect with autopart fetch
function DefectItemRow({ defect, formatCurrency, recordId, existingOrder, defectsFinished }: { defect: ChecklistDefectItem; formatCurrency: (v: number) => string; recordId: string; existingOrder?: IServiceOrder; defectsFinished?: boolean }) {
    const api = useMemo(() => getApiClient(), [])
    const [autopart, setAutopart] = useState<any>(null)
    const [loadingAutopart, setLoadingAutopart] = useState(false)
    const [serviceOrder, setServiceOrder] = useState<IServiceOrder | null>(null)
    const [creatingOrder, setCreatingOrder] = useState(false)
    const [orderError, setOrderError] = useState<string | null>(null)

    const vehiclePart = (defect as any).vehicle_part_id
    const suggestedPart = (defect as any).suggested_part_id
    const failureType = (defect as any).failure_type as string | undefined
    const quantity = (defect as any).quantity as number | undefined

    const [orderQuantity, setOrderQuantity] = useState<number | string>(quantity || 1)

    // Get autopart_id from vehicle_part_id
    const autopartId = typeof vehiclePart === 'object' ? vehiclePart.autopart_id : undefined
    const autopartIdStr = typeof autopartId === 'object' ? autopartId._id : typeof autopartId === 'string' ? autopartId : undefined

    useEffect(() => {
        if (!autopartIdStr) return

        let mounted = true
        const load = async () => {
            setLoadingAutopart(true)
            try {
                const res = await api.getAutoPartById(autopartIdStr)
                console.log('getAutoPartById response:', res)
                console.log('getAutoPartById data:', res.data)
                if (mounted) setAutopart(res.data)
            } catch (e) {
                console.error('getAutoPartById error:', e)
            } finally {
                if (mounted) setLoadingAutopart(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [autopartIdStr, api])

    // Determine vehicle part name
    let vehiclePartName = '—'
    if (autopart) {
        vehiclePartName = autopart.name || autopart._id || '—'
    } else if (typeof vehiclePart === 'object' && vehiclePart.autopart_id) {
        const ap = vehiclePart.autopart_id
        vehiclePartName = typeof ap === 'object' ? (ap.name || ap._id || '—') : String(ap || '—')
    } else if (typeof vehiclePart === 'object') {
        vehiclePartName = vehiclePart.name || vehiclePart._id || '—'
    } else {
        vehiclePartName = String(vehiclePart || '—')
    }

    const suggestedPartName = typeof suggestedPart === 'object'
        ? (suggestedPart.name || suggestedPart._id || '—')
        : suggestedPart ? String(suggestedPart) : undefined

    const unitPrice: number | undefined = typeof suggestedPart === 'object'
        ? (suggestedPart.selling_price ?? suggestedPart.cost_price)
        : undefined

    const total = unitPrice !== undefined && quantity !== undefined ? unitPrice * quantity : undefined

    const handleCreateServiceOrder = async () => {
        if (!suggestedPart || typeof suggestedPart !== 'object' || !suggestedPart._id) {
            setOrderError('No suggested part available for order')
            return
        }

        const qty = Number(orderQuantity)
        if (!qty || qty <= 0) {
            setOrderError('Please enter a valid quantity')
            return
        }

        setCreatingOrder(true)
        setOrderError(null)
        try {
            const res = await api.createServiceOrder({
                service_record_id: recordId,
                checklist_defect_id: (defect as any)._id,
                part_id: suggestedPart._id,
                quantity: qty
            })
            setServiceOrder(res.data)
        } catch (e: any) {
            setOrderError(e?.message || 'Failed to create service order')
        } finally {
            setCreatingOrder(false)
        }
    }

    return (
        <div className="rounded border bg-muted/60 p-2">
            <div className="text-xs text-foreground  mb-1">Detected Part of Customer's Vehicle:</div>
            <div className="flex items-center justify-between">
                <span className=" font-medium ">
                    {vehiclePartName}
                    {loadingAutopart && <Spinner className="h-2 w-2" />}
                </span>
                {quantity !== undefined && (
                    <Badge variant="secondary">Suggested: {quantity}</Badge>
                )}
            </div>
            {failureType && (
                <div className="text-xs text-muted-foreground mt-1">
                    TYPE: {failureType.replace(/_/g, ' ')}
                </div>
            )}

            {suggestedPartName && (
                <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                    <div className="font-medium text-foreground mb-1">Suggested Replacement:</div>
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground bg-blue-500/10 px-2 py-1 rounded">{suggestedPartName}</span>
                        {total !== undefined && (
                            <Badge variant="outline" className="shrink-0">
                                {formatCurrency(total)}
                            </Badge>
                        )}
                    </div>
                    {unitPrice !== undefined && (
                        <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                            <Wallet className="h-3.5 w-3.5" />
                            Unit Price: {formatCurrency(unitPrice)}
                        </div>
                    )}
                </div>
            )}

            {serviceOrder || existingOrder ? (
                <div className="mt-2 pt-2 border-t text-xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium text-green-600 mb-0.5">✓ Order Created</div>
                            <div className="text-muted-foreground">
                                Status: <Badge variant="outline" className="ml-1">{(serviceOrder || existingOrder)?.stock_status}</Badge>
                            </div>
                            <div className="text-muted-foreground">
                                Qty: <span className="font-medium">{(serviceOrder || existingOrder)?.quantity}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : defectsFinished ? (
                <div className="mt-2 pt-2 border-t">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Lock className="h-3.5 w-3.5" />
                        <span>Order creation finished</span>
                    </div>
                </div>
            ) : (
                <div className="mt-2 pt-2 border-t">
                    <div className="text-xs text-slate-600 mb-2">Quantity:</div>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min="1"
                            value={orderQuantity}
                            onChange={(e) => setOrderQuantity(e.target.value)}
                            className="w-16 px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-900"
                            disabled={creatingOrder}
                        />
                        <button
                            onClick={handleCreateServiceOrder}
                            disabled={creatingOrder || !suggestedPart}
                            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {creatingOrder ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                    {orderError && (
                        <div className="text-xs text-red-600 mt-1">{orderError}</div>
                    )}
                </div>
            )}
        </div>
    )
}

export function RecordChecklists({ recordId }: RecordChecklistsProps) {
    const api = useMemo(() => getApiClient(), [])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [items, setItems] = useState<RecordChecklistsListResponse["data"]>([])
    const [defectsByChecklist, setDefectsByChecklist] = useState<Map<string, ChecklistDefectItem[]>>(new Map())
    const [existingOrders, setExistingOrders] = useState<Map<string, IServiceOrder>>(new Map())
    const [defectsFinished, setDefectsFinished] = useState(false)
    const [togglingDefects, setTogglingDefects] = useState(false)

    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                setLoading(true)
                setError(null)
                const res = await api.getRecordChecklistsByRecord(recordId)
                if (!mounted) return
                setItems(res.data || [])

                // Load defects for each checklist item
                const defectsMap = new Map<string, ChecklistDefectItem[]>()
                for (const item of res.data || []) {
                    try {
                        const defectsRes = await api.getChecklistDefectsByRecordChecklist((item as any)._id)
                        defectsMap.set((item as any)._id, defectsRes.data || [])
                    } catch (e) {
                        // Silently fail for individual defect loads
                        defectsMap.set((item as any)._id, [])
                    }
                }
                if (mounted) {
                    setDefectsByChecklist(defectsMap)
                }

                // Load existing orders for this record
                try {
                    const ordersRes = await api.getServiceOrdersByRecord(recordId)
                    if (mounted) {
                        const ordersMap = new Map<string, IServiceOrder>()
                        ordersRes.data.forEach(order => {
                            const defectId = typeof order.checklist_defect_id === 'object'
                                ? (order.checklist_defect_id as any)._id
                                : order.checklist_defect_id
                            ordersMap.set(defectId, order)
                        })
                        setExistingOrders(ordersMap)
                    }
                } catch (e) {
                    // Silently fail for orders load
                }

                // Load service record to get defects_finished status
                try {
                    // Extract service_record_id from appointment (if needed)
                    // For now, assume recordId IS the service_record_id
                    const srRes = await api.getServiceRecordById(recordId)
                    if (mounted) {
                        setDefectsFinished(srRes.defects_finished ?? false)
                    }
                } catch (e) {
                    // Silently fail for service record load
                }
            } catch (e: any) {
                if (!mounted) return
                setError(e?.message || "Failed to load checklist")
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [api, recordId])

    const handleToggleDefectsFinished = async () => {
        try {
            setTogglingDefects(true)
            const newStatus = !defectsFinished
            await api.updateServiceRecord(recordId, {
                defects_finished: newStatus
            })
            setDefectsFinished(newStatus)
        } catch (e: any) {
            console.error('Failed to toggle defects finished:', e)
        } finally {
            setTogglingDefects(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground"><Spinner /> Loading checklist...</div>
        )
    }

    if (error) {
        return <div className="text-sm text-red-600">{error}</div>
    }

    if (!items.length) {
        return <div className="text-sm text-muted-foreground">No checklist available for this record</div>
    }

    const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)

    return (
        <Card className="border-dashed">
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <ListChecks className="h-4 w-4" />
                    Current Tasks
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {items.map((it) => {
                    const checklistName = typeof (it as any).checklist_id === "object"
                        ? (it as any).checklist_id.name
                        : String((it as any).checklist_id)

                    const st = String((it as any).status || "pending").toLowerCase()
                    const badgeCls = statusBadge[st] || "bg-gray-500/10 text-gray-600 border-gray-500/20"

                    const defects = defectsByChecklist.get((it as any)._id) || []

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

                            {Array.isArray(defects) && defects.length > 0 && (
                                <div className="mt-3">
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
                                        <Info className="h-3.5 w-3.5" /> Detected Defects
                                    </div>
                                    <div className="grid gap-2">
                                        {defects.map((defect, idx) => {
                                            const defectId = (defect as any)._id
                                            const existingOrder = existingOrders.get(defectId)
                                            return (
                                                <DefectItemRow
                                                    key={idx}
                                                    defect={defect}
                                                    formatCurrency={formatCurrency}
                                                    recordId={recordId}
                                                    existingOrder={existingOrder}
                                                    defectsFinished={defectsFinished}
                                                />
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}

                <Separator />
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600 flex-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Real-time updates
                    </div>
                    {!defectsFinished && (
                        <button
                            onClick={handleToggleDefectsFinished}
                            disabled={togglingDefects}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {togglingDefects ? 'Saving...' : 'Finished'}
                        </button>
                    )}
                    {defectsFinished && (
                        <span className="px-3 py-1 text-xs bg-slate-300 text-slate-700 rounded flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Done
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export default RecordChecklists

