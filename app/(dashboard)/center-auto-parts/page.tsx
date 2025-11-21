"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getApiClient, type CenterAutoPartRecord, type CenterRecord, type AutoPartRecord } from "@/lib/api"
import { useAuth, useIsAdmin, useIsStaff } from "@/components/auth-provider"
import { AdminStaffTechnicianOnly } from "@/components/role-guards"
import { CenterAutoPartDialog } from "@/components/center-auto-parts/center-auto-part-dialog"
import { ForecastInfoDialog } from "@/components/center-auto-parts/forecast-info-dialog"
import { UrgentPartsDialog } from "@/components/center-auto-parts/urgent-parts-dialog"
import { DataPagination } from "@/components/ui/data-pagination"
import { Pencil, Plus, Trash2, Search, LineChart, AlertCircle } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"

export default function CenterAutoPartsPage() {
	const api = useMemo(() => getApiClient(), [])
	const isAdmin = useIsAdmin()
	const isStaff = useIsStaff()
	const { user } = useAuth()
	const [items, setItems] = useState<CenterAutoPartRecord[]>([])
	const [loading, setLoading] = useState(true)

	const [centers, setCenters] = useState<CenterRecord[]>([])
	const [parts, setParts] = useState<AutoPartRecord[]>([])

	const [centerFilter, setCenterFilter] = useState<string>("all")
	const [partFilter, setPartFilter] = useState<string>("all")
	const [query, setQuery] = useState("")

	const [dialogOpen, setDialogOpen] = useState(false)
	const [selected, setSelected] = useState<CenterAutoPartRecord | null>(null)

	const [forecastOpen, setForecastOpen] = useState(false)
	const [forecastCenterId, setForecastCenterId] = useState<string | null>(null)
	const [forecastPartId, setForecastPartId] = useState<string | null>(null)

	const [urgentOpen, setUrgentOpen] = useState(false)
	const [urgentCenterId, setUrgentCenterId] = useState<string | null>(null)
	const [urgentCenterName, setUrgentCenterName] = useState<string | undefined>(undefined)

	const [deletingId, setDeletingId] = useState<string | null>(null)

	const [currentPage, setCurrentPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const [totalItems, setTotalItems] = useState(0)
	const limit = 20

	const load = useCallback(async (page: number) => {
		try {
			setLoading(true)
			const centerAutoPartsParams: any = { page, limit }

			
			if (!isAdmin && user?.centerId) {
				centerAutoPartsParams.center_id = user.centerId
			}

			const [centersRes, partsRes, listRes] = await Promise.all([
				api.getCenters({ limit: 200 }).then(r => r.data.centers),
				api.getAutoParts(1, 200).then(r => r.data.parts),
				api.getCenterAutoParts(centerAutoPartsParams),
			])
			setCenters(centersRes)
			setParts(partsRes)
			setItems(listRes.data.items)
			setTotalItems(listRes.data.total || listRes.data.items.length)
			setTotalPages(Math.ceil((listRes.data.total || listRes.data.items.length) / limit))
		} catch (e: any) {
			toast.error(e?.message || "Failed to load data")
		} finally {
			setLoading(false)
		}
	}, [api, toast])

	useEffect(() => {
		load(currentPage)
	}, [load, currentPage])

	const filtered = items.filter(it => {
		if (!it.center_id || !it.part_id) return false

		const c = typeof it.center_id === 'string' ? it.center_id : it.center_id._id
		const p = typeof it.part_id === 'string' ? it.part_id : it.part_id._id
		const centerOk = centerFilter === 'all' || c === centerFilter
		const partOk = partFilter === 'all' || p === partFilter
		const kw = query.toLowerCase()
		const centerName = typeof it.center_id === 'string' ? it.center_id : (it.center_id.name || "")
		const partName = typeof it.part_id === 'string' ? it.part_id : (it.part_id.name || "")
		const kwOk = !kw || centerName.toLowerCase().includes(kw) || partName.toLowerCase().includes(kw)
		return centerOk && partOk && kwOk
	})

	const openCreate = () => { setSelected(null); setDialogOpen(true) }
	const openEdit = (rec: CenterAutoPartRecord) => { setSelected(rec); setDialogOpen(true) }

	const handleDelete = async (id: string) => {
		try {
			setDeletingId(id)
			await api.deleteCenterAutoPart(id)
			setItems(prev => prev.filter(x => x._id !== id))
			toast.success("Deleted successfully")
		} catch (e: any) {
			toast.error(e?.message || "Failed to delete")
		} finally {
			setDeletingId(null)
		}
	}

	const openForecast = (rec: CenterAutoPartRecord) => {
		const c = typeof rec.center_id === 'string' ? rec.center_id : rec.center_id?._id
		const p = typeof rec.part_id === 'string' ? rec.part_id : rec.part_id?._id
		if (!c || !p) {
			toast.error("Center ID or Part ID not found")
			return
		}
		setForecastCenterId(c)
		setForecastPartId(p)
		setForecastOpen(true)
	}

	const openUrgent = (centerId: string, centerName?: string) => {
		setUrgentCenterId(centerId)
		setUrgentCenterName(centerName)
		setUrgentOpen(true)
	}

	const canManage = isAdmin || isStaff

	return (
		<AdminStaffTechnicianOnly>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold">Center Inventory</h1>
						<p className="text-muted-foreground">Manage auto parts stock by service center</p>
					</div>
					{canManage && <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Inventory</Button>}
				</div>

				<Tabs defaultValue="inventory" className="w-full">
					<TabsList>
						<TabsTrigger value="inventory">Inventory</TabsTrigger>
						<TabsTrigger value="urgent" className="flex items-center gap-2">
							<AlertCircle className="h-4 w-4" />
							Urgent Parts
						</TabsTrigger>
					</TabsList>

					<TabsContent value="inventory">
						<Card>
							<CardHeader>
								<div className="flex items-center gap-3">
									<div className="relative flex-1">
										<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
										<Input placeholder="Search by center or part..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
									</div>
									<Select value={centerFilter} onValueChange={setCenterFilter}>
										<SelectTrigger className="w-[220px]"><SelectValue placeholder="All centers" /></SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All centers</SelectItem>
											{centers.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
										</SelectContent>
									</Select>
									<Select value={partFilter} onValueChange={setPartFilter}>
										<SelectTrigger className="w-[220px]"><SelectValue placeholder="All parts" /></SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All parts</SelectItem>
											{parts.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
										</SelectContent>
									</Select>
								</div>
							</CardHeader>
							<CardContent>
								{loading ? (
									<div className="text-center py-8">Loading...</div>
								) : filtered.length === 0 ? (
									<div className="text-center py-8 text-muted-foreground">No data</div>
								) : (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Center</TableHead>
												<TableHead>Part</TableHead>
												<TableHead className="text-right">Quantity</TableHead>
												<TableHead className="text-right">Min Stock</TableHead>
												<TableHead className="text-right">Recommended Min</TableHead>
												<TableHead>Last Forecast</TableHead>
												<TableHead>Created</TableHead>
												<TableHead className="text-right">Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{filtered.map((it) => {
												const centerName = typeof it.center_id === 'string' ? it.center_id : (it.center_id?.name || "—")
												const partName = typeof it.part_id === 'string' ? it.part_id : (it.part_id?.name || "—")
												return (
													<TableRow key={it._id}>
														<TableCell className="font-medium">{centerName}</TableCell>
														<TableCell>{partName}</TableCell>
														<TableCell className="text-right">{it.quantity}</TableCell>
														<TableCell className="text-right">{it.min_stock}</TableCell>
														<TableCell className="text-right">{it.recommended_min_stock}</TableCell>
														<TableCell>{it.last_forecast_date ? formatDate(it.last_forecast_date) : "-"}</TableCell>
														<TableCell>{formatDate(it.createdAt)}</TableCell>
														<TableCell className="text-right">
															<div className="flex justify-end gap-2">
																{canManage && (
																	<>
																		<Button title="View forecast" variant="ghost" size="sm" onClick={() => openForecast(it)}>
																			<LineChart className="h-4 w-4" />
																		</Button>
																		<Button variant="ghost" size="sm" onClick={() => openEdit(it)}><Pencil className="h-4 w-4" /></Button>
																		<Button variant="ghost" size="sm" onClick={() => handleDelete(it._id)} disabled={deletingId === it._id}><Trash2 className="h-4 w-4 text-destructive" /></Button>
																	</>
																)}
															</div>
														</TableCell>
													</TableRow>
												)
											})}
										</TableBody>
									</Table>
								)}
							</CardContent>
						</Card>

						<div className="mt-4">
							<DataPagination
								currentPage={currentPage}
								totalPages={totalPages}
								onPageChange={setCurrentPage}
							/>
						</div>
					</TabsContent>

					<TabsContent value="urgent">
						<Card>
							<CardHeader>
								<CardTitle>Urgent Parts by Center</CardTitle>
								<p className="text-sm text-muted-foreground">View parts that need immediate attention at each service center</p>
							</CardHeader>
							<CardContent>
								{loading ? (
									<div className="text-center py-8">Loading...</div>
								) : centers.length === 0 ? (
									<div className="text-center py-8 text-muted-foreground">No centers available</div>
								) : (
									<div className="grid grid-cols-1 gap-3">
										{centers.map((center) => (
											<Button
												key={center._id}
												variant="outline"
												className="h-auto justify-between p-4"
												onClick={() => openUrgent(center._id, center.name)}
											>
												<div className="text-left">
													<div className="font-semibold">{center.name}</div>
													<div className="text-sm text-muted-foreground">{center.address || "No address"}</div>
												</div>
												<AlertCircle className="h-5 w-5 text-orange-500" />
											</Button>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				<CenterAutoPartDialog open={dialogOpen} onOpenChange={setDialogOpen} record={selected} onSuccess={() => load(currentPage)} />
				<ForecastInfoDialog open={forecastOpen} onOpenChange={setForecastOpen} centerId={forecastCenterId} partId={forecastPartId} />
				<UrgentPartsDialog open={urgentOpen} onOpenChange={setUrgentOpen} centerId={urgentCenterId} centerName={urgentCenterName} />
			</div>
		</AdminStaffTechnicianOnly>
	)
}
