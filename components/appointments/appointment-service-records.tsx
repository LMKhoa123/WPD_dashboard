"use client"

import { useEffect, useMemo, useState } from "react"
import { getApiClient, type ServiceRecordRecord, type SystemUserRecord, type AppointmentStatus } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Separator } from "@/components/ui/separator"
import RecordChecklists from "./record-checklists"
import { User, Clock, ClipboardList } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ImportRequestDialog } from "@/components/import-requests/import-request-dialog"

export interface AppointmentServiceRecordsProps {
    appointmentId: string
    appointmentStatus?: AppointmentStatus
    onAppointmentStatusChange?: (status: AppointmentStatus) => void
}

const recordStatusColor: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    "in-progress": "bg-blue-500/10 text-blue-600 border-blue-500/20",
    completed: "bg-green-500/10 text-green-600 border-green-500/20",
    cancelled: "bg-gray-500/10 text-gray-600 border-gray-500/20",
}

export function AppointmentServiceRecords({ appointmentId, appointmentStatus, onAppointmentStatusChange }: AppointmentServiceRecordsProps) {
    const api = useMemo(() => getApiClient(), [])
    const [records, setRecords] = useState<ServiceRecordRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [technicians, setTechnicians] = useState<SystemUserRecord[]>([])
    const [loadingTech, setLoadingTech] = useState(false)
    const [lackingItemsByRecord, setLackingItemsByRecord] = useState<Record<string, Array<{ part_id: string; quantity_needed: number }>>>({})
    const [allSufficientByRecord, setAllSufficientByRecord] = useState<Record<string, boolean>>({})
    const [requestOpen, setRequestOpen] = useState(false)
    const [requestItems, setRequestItems] = useState<Array<{ part_id: string; quantity_needed: number }>>([])
    const [requestNotes, setRequestNotes] = useState<string>("")

    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                setLoading(true)
                setError(null)
                const rs = await api.getServiceRecordsByAppointmentId(appointmentId)
                if (!mounted) return
                setRecords(rs)
                // For each record, load service orders and collect LACKING items
                const map: Record<string, Array<{ part_id: string; quantity_needed: number }>> = {}
                const sufficientMap: Record<string, boolean> = {}
                const results = await Promise.allSettled(
                    rs.map(async (rec) => {
                        try {
                            const ordersRes = await api.getServiceOrdersByRecord(rec._id)
                            const orders = ordersRes.data
                            
                            // Check if all items are SUFFICIENT
                            const allSufficient = orders.length > 0 && orders.every(o => (o as any).stock_status === 'SUFFICIENT')
                            sufficientMap[rec._id] = allSufficient
                            
                            // Collect LACKING items
                            const lacking = orders
                                .filter(o => (o as any).stock_status === 'LACKING')
                                .map(o => {
                                    const partId = (o as any).part_id
                                    const partIdStr = typeof partId === 'object' ? partId._id : partId
                                    return { part_id: partIdStr, quantity_needed: (o as any).quantity }
                                })
                            map[rec._id] = lacking
                        } catch {
                            map[rec._id] = []
                            sufficientMap[rec._id] = false
                        }
                    })
                )
                setLackingItemsByRecord(map)
                setAllSufficientByRecord(sufficientMap)

                try {
                    setLoadingTech(true)
                    const objTechs: any[] = []
                    const idTechs: string[] = []
                    for (const r of rs) {
                        const tech: any = (r as any).technician_id
                        if (!tech) continue
                        if (typeof tech === "string") idTechs.push(tech)
                        else objTechs.push(tech)
                    }
                    const fetched: SystemUserRecord[] = []
                    if (idTechs.length) {
                        const uniqueIds = Array.from(new Set(idTechs))
                        const results = await Promise.allSettled(uniqueIds.map(id => api.getSystemUserById(id)))
                        for (const res of results) if (res.status === 'fulfilled') fetched.push(res.value)
                    }
                    const merged = [...objTechs, ...fetched] as SystemUserRecord[]
                    const dedup = new Map<string, SystemUserRecord>()
                    for (const t of merged) {
                        const id = (t as any)._id || (typeof (t as any).userId === 'object' ? (t as any).userId._id : undefined)
                        if (id && !dedup.has(id)) dedup.set(id, t)
                    }
                    if (mounted) setTechnicians(Array.from(dedup.values()))
                } finally {
                    if (mounted) setLoadingTech(false)
                }
            } catch (e: any) {
                if (!mounted) return
                setError(e?.message || "Failed to load service records")
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [api, appointmentId])

    if (loading) return <div className="flex items-center gap-2 text-muted-foreground"><Spinner /> Loading service records...</div>
    if (error) return <div className="text-sm text-red-600">{error}</div>
    if (!records.length) return <div className="text-sm text-muted-foreground">No service records for this appointment</div>

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" /> Technicians performing the service
                        {loadingTech && <Spinner className="h-4 w-4" />}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loadingTech ? (
                        <div className="flex items-center gap-2 text-muted-foreground"><Spinner /> Loading technicians...</div>
                    ) : technicians.length > 0 ? (
                        <div className="space-y-6">
                            {technicians.map((tech, idx) => {
                                const isFull = (t: any): t is SystemUserRecord => t && 'userId' in t && 'isOnline' in t
                                return (
                                    <div key={(tech as any)._id || idx} className="grid gap-3 md:grid-cols-2">
                                        <div>
                                            <p className="text-sm font-medium">Technician Name</p>
                                            <p className="text-lg font-semibold">{(tech as any).name || '—'}</p>
                                        </div>
                                        {isFull(tech) && tech.userId && typeof tech.userId === 'object' && (
                                            <div>
                                                <p className="text-sm font-medium">Email</p>
                                                <p className="text-sm text-muted-foreground">{tech.userId.email}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium">Role</p>
                                            <Badge variant="outline">TECHNICIAN</Badge>
                                        </div>
                                        {isFull(tech) && tech.userId && typeof tech.userId === 'object' && tech.userId.phone && (
                                            <div>
                                                <p className="text-sm font-medium">Phone Number</p>
                                                <p className="text-sm text-muted-foreground">{tech.userId.phone}</p>
                                            </div>
                                        )}
                                        {isFull(tech) && (
                                            <div>
                                                <p className="text-sm font-medium">Status</p>
                                                <Badge variant={tech.isOnline ? 'default' : 'secondary'}>
                                                    {tech.isOnline ? 'Online' : 'Offline'}
                                                </Badge>
                                            </div>
                                        )}
                                        {(tech as any).centerId && (
                                            <div>
                                                <p className="text-sm font-medium">Center ID</p>
                                                <p className="text-sm text-muted-foreground">{typeof (tech as any).centerId === 'string' ? (tech as any).centerId : (tech as any).centerId._id}</p>
                                            </div>
                                        )}
                                        {(tech as any).certificates && (tech as any).certificates.length > 0 && (
                                            <div className="md:col-span-2">
                                                <p className="text-sm font-medium mb-2">Certificates</p>
                                                <div className="space-y-2">
                                                    {(tech as any).certificates.map((cert: any, cidx: number) => (
                                                        <div key={cidx} className="text-sm p-2 bg-muted rounded">
                                                            <p className="font-medium">{cert.name}</p>
                                                            <p className="text-xs text-muted-foreground">{cert.issuingOrganization}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">Chưa có kỹ thuật viên</div>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-6">
                {records.map(r => {
                    const tech = (r as any).technician_id
                    const status = String((r as any).status || 'pending').toLowerCase()
                    const badgeCls = recordStatusColor[status] || "bg-gray-500/10 text-gray-600 border-gray-500/20"
                    return (
                        <Card key={r._id} className="shadow-sm">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between gap-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <ClipboardList className="h-4 w-4" />#{r._id.slice(-6)} Suggestion of Technician
                                    </CardTitle>
                                    {allSufficientByRecord[r._id] ? (
                                        // All items are SUFFICIENT, show Create Invoice button
                                        <Link href={`/service-records/${r._id}/suggested-parts`}>
                                            <Button size="sm" variant="outline">Create Invoice</Button>
                                        </Link>
                                    ) : (lackingItemsByRecord[r._id] && lackingItemsByRecord[r._id].length > 0) ? (
                                        // Has LACKING items, always show Create Request button
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setRequestItems(lackingItemsByRecord[r._id])
                                                setRequestNotes(`Auto-generated from service record #${r._id}`)
                                                setRequestOpen(true)
                                            }}
                                        >
                                            Create Request
                                        </Button>
                                    ) : (appointmentStatus === 'waiting-for-parts') ? (
                                        // Waiting for parts and no lacking items shown in current record
                                        <div className="text-sm text-muted-foreground">đã gửi yêu cầu, vui lòng chờ</div>
                                    ) : null}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                    <Badge variant="outline" className={badgeCls}>{status.replace(/-/g, ' ')}</Badge>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>{new Date(r.start_time).toLocaleString('vi-VN')} → {new Date(r.end_time).toLocaleString('vi-VN')}</span>
                                    </div>
                                    {tech && (
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <User className="h-3.5 w-3.5" />
                                            <span>{typeof tech === 'object' ? (tech.name || tech._id) : tech}</span>
                                        </div>
                                    )}
                                </div>
                                {r.description && (
                                    <p className="text-sm text-muted-foreground leading-relaxed">{r.description}</p>
                                )}
                                <Separator />
                                <RecordChecklists recordId={r._id} />
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
            {/* Import Request Dialog */}
            <ImportRequestDialog
                open={requestOpen}
                onOpenChange={setRequestOpen}
                request={null}
                initialItems={requestItems}
                initialNotes={requestNotes}
                appointmentId={appointmentId}
                onAppointmentStatusUpdated={(st) => {
                    if (st === 'waiting-for-parts') {
                        onAppointmentStatusChange?.('waiting-for-parts')
                    }
                }}
                onSaved={() => {
                    setRequestOpen(false)
                }}
            />
        </div>
    )
}

export default AppointmentServiceRecords
