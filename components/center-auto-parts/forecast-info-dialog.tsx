"use client"

import React, { useEffect, useMemo, useState } from "react"
import { getApiClient, type ForecastResultItem, type ForecastInfoResponse } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface ForecastInfoDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    centerId: string | null
    partId: string | null
}

export function ForecastInfoDialog({ open, onOpenChange, centerId, partId }: ForecastInfoDialogProps) {
    const api = useMemo(() => getApiClient(), [])
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<ForecastResultItem | null>(null)
    const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null)
    const [page, setPage] = useState<number>(1)

    useEffect(() => {
        const fetchData = async () => {
            if (!open) return
            if (!centerId || !partId) return
            try {
                setLoading(true)
                setError(null)
                setResult(null)
                const res: ForecastInfoResponse = await api.getForecastByCenterPart(centerId, partId, { limit: 1, page })
                const first = res.results?.[0] ?? null
                setResult(first)
                setMeta({ total: res.total || 0, page: res.page || 1, limit: res.limit || 1, totalPages: res.totalPages || 1 })
                if (!first) {
                    setError("No forecast found for this part at this center.")
                }
            } catch (e: any) {
                const msg = e?.message || "Failed to load forecast"
                setError(msg)
                toast({ title: "Không tải được forecast", description: msg, variant: "destructive" })
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [open, centerId, partId, page, api, toast])

    useEffect(() => {
        if (!open) {
            setPage(1)
        }
    }, [open])

    const riskColor = (level?: string) => {
        switch ((level || "").toUpperCase()) {
            case "HIGH": return "destructive"
            case "MEDIUM": return "secondary"
            case "LOW": return "default"
            default: return "outline"
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Forecast analysis</DialogTitle>
                    <DialogDescription>
                        Latest AI analysis for this part at the selected center
                    </DialogDescription>
                </DialogHeader>
                {loading ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
                ) : error ? (
                    <div className="space-y-3">
                        <div className="text-sm text-red-600">{error}</div>
                        <div className="text-xs text-muted-foreground">Make sure a forecast has been generated for this item.</div>
                    </div>
                ) : result ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Badge variant={riskColor(result.analysis?.riskLevel)}>{result.analysis?.riskLevel ?? "N/A"}</Badge>
                            <div className="font-medium leading-tight">{result.analysis?.title || "—"}</div>
                        </div>
                        <Separator />
                        <ScrollArea className="max-h-60 pr-2">
                            <p className="whitespace-pre-wrap text-sm leading-6">{result.analysis?.content || "—"}</p>
                        </ScrollArea>
                        <div className="text-sm text-muted-foreground">
                            Suggested order qty: <span className="font-medium text-foreground">{result.analysis?.suggestedOrderQty ?? 0}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Created: {result.createdAt ? new Date(result.createdAt).toLocaleString() : "—"}
                        </div>
                        {meta && (
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">Page {meta.page} / {meta.totalPages} ({meta.total} results)</div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page <= 1 || loading}
                                    >
                                        <ChevronLeft className="h-4 w-4" /> Prev
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => (meta ? Math.min(meta.totalPages, p + 1) : p + 1))}
                                        disabled={!meta || page >= meta.totalPages || loading}
                                    >
                                        Next <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                        </div>
                    </div>
                ) : (
                    <div className="py-6 text-sm text-muted-foreground">No forecast data.</div>
                )}
            </DialogContent>
        </Dialog>
    )
}
