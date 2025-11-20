"use client"

import React, { useEffect, useState, useMemo, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getApiClient, type UrgentPartItem } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { AlertCircle, Loader2, TrendingUp } from "lucide-react"

interface UrgentPartsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    centerId: string | null
    centerName?: string
}

export function UrgentPartsDialog({ open, onOpenChange, centerId, centerName }: UrgentPartsDialogProps) {
    const api = useMemo(() => getApiClient(), [])
    const [items, setItems] = useState<UrgentPartItem[]>([])
    const [loading, setLoading] = useState(false)

    const loadUrgentParts = useCallback(async () => {
        if (!centerId) return
        try {
            setLoading(true)
            const result = await api.getUrgentParts(centerId, 50)
            setItems(result.data || [])
        } catch (e: any) {
            toast.error(e?.message || "Failed to load urgent parts")
        } finally {
            setLoading(false)
        }
    }, [api, centerId])

    useEffect(() => {
        if (open && centerId) {
            loadUrgentParts()
        }
    }, [open, centerId, loadUrgentParts])

    const getPartName = (item: UrgentPartItem): string => {
        if (typeof item.part_id === 'string') {
            return item.part_id
        }
        return item.part_id?.name || "—"
    }

    const getRiskBadgeColor = (riskLevel: string) => {
        switch (riskLevel) {
            case "HIGH":
                return "destructive"
            case "MEDIUM":
                return "secondary"
            default:
                return "outline"
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        Urgent Parts{centerName && ` - ${centerName}`}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            No urgent parts found. Inventory is healthy!
                        </div>
                    ) : (
                        <div className="space-y-4 pr-2">
                            {items.map((item) => {
                                const partName = getPartName(item)
                                const { analysis } = item
                                return (
                                    <Card key={item._id} className={`p-4 border-l-4 ${analysis.riskLevel === "HIGH"
                                            ? "border-l-red-500 bg-red-50"
                                            : "border-l-orange-500 bg-orange-50"
                                        }`}>
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-lg">{partName}</h3>
                                                        <Badge variant={getRiskBadgeColor(analysis.riskLevel)}>
                                                            {analysis.riskLevel}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-700 mt-1">{analysis.title}</p>
                                                </div>
                                            </div>

                                            <p className="text-sm text-gray-600 leading-relaxed">{analysis.content}</p>

                                            <div className="bg-white rounded p-3 border border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-600">Suggested Order Quantity:</span>
                                                    <span className="text-lg font-bold text-red-600">{analysis.suggestedOrderQty} units</span>
                                                </div>
                                            </div>

                                            <div className="text-xs text-gray-500">
                                                Last updated: {formatDate(item.updatedAt)}
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    <Button onClick={loadUrgentParts} disabled={loading}>
                        {loading ? "Loading..." : "Refresh"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
