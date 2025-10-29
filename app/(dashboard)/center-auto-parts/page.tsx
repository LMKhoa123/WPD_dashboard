// "use client"

// import React, { useCallback, useEffect, useMemo, useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { getApiClient, type CenterAutoPartRecord, type CenterRecord, type AutoPartRecord } from "@/lib/api"
// import { useToast } from "@/hooks/use-toast"
// import { useRole } from "@/components/auth-provider"
// import { CenterAutoPartDialog } from "@/components/center-auto-parts/center-auto-part-dialog"
// import { Pencil, Plus, Trash2, Search } from "lucide-react"

// export default function CenterAutoPartsPage() {
//   const role = useRole()
//   const { toast } = useToast()
//   const api = useMemo(() => getApiClient(), [])

//   const [items, setItems] = useState<CenterAutoPartRecord[]>([])
//   const [loading, setLoading] = useState(true)

//   const [centers, setCenters] = useState<CenterRecord[]>([])
//   const [parts, setParts] = useState<AutoPartRecord[]>([])

//   const [centerFilter, setCenterFilter] = useState<string>("all")
//   const [partFilter, setPartFilter] = useState<string>("all")
//   const [query, setQuery] = useState("")

//   const [dialogOpen, setDialogOpen] = useState(false)
//   const [selected, setSelected] = useState<CenterAutoPartRecord | null>(null)

//   const [deleteOpen, setDeleteOpen] = useState(false)
//   const [deletingId, setDeletingId] = useState<string | null>(null)

//   const load = useCallback(async () => {
//     try {
//       setLoading(true)
//       const [centersRes, partsRes, listRes] = await Promise.all([
//         api.getCenters({ limit: 200 }).then(r => r.data.centers),
//         api.getAutoParts(1, 200).then(r => r.data.parts),
//         api.getCenterAutoParts({ page: 1, limit: 200 }),
//       ])
//       setCenters(centersRes)
//       setParts(partsRes)
//       setItems(listRes.data.items)
//     } catch (e: any) {
//       toast({ title: "Không tải được dữ liệu", description: e?.message || "Failed to load data", variant: "destructive" })
//     } finally {
//       setLoading(false)
//     }
//   }, [api, toast])

//   useEffect(() => { load() }, [load])

//   const filtered = items.filter(it => {
//     const c = typeof it.center_id === 'string' ? it.center_id : it.center_id._id
//     const p = typeof it.part_id === 'string' ? it.part_id : it.part_id._id
//     const centerOk = centerFilter === 'all' || c === centerFilter
//     const partOk = partFilter === 'all' || p === partFilter
//     const kw = query.toLowerCase()
//     const centerName = typeof it.center_id === 'string' ? it.center_id : (it.center_id.name || "")
//     const partName = typeof it.part_id === 'string' ? it.part_id : (it.part_id.name || "")
//     const kwOk = !kw || centerName.toLowerCase().includes(kw) || partName.toLowerCase().includes(kw)
//     return centerOk && partOk && kwOk
//   })

//   const openCreate = () => { setSelected(null); setDialogOpen(true) }
//   const openEdit = (rec: CenterAutoPartRecord) => { setSelected(rec); setDialogOpen(true) }

//   const handleDelete = async (id: string) => {
//     try {
//       setDeletingId(id)
//       await api.deleteCenterAutoPart(id)
//       setItems(prev => prev.filter(x => x._id !== id))
//       toast({ title: "Đã xóa" })
//     } catch (e: any) {
//       toast({ title: "Xóa thất bại", description: e?.message || "Failed to delete", variant: "destructive" })
//     } finally {
//       setDeletingId(null)
//     }
//   }

//   if (role !== "Admin") {
//     return (
//       <div className="flex items-center justify-center h-[50vh]">
//         <div className="text-center">
//           <h2 className="text-2xl font-bold text-muted-foreground">Access Denied</h2>
//           <p className="text-muted-foreground mt-2">This page is only accessible to administrators.</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold">Center Inventory</h1>
//           <p className="text-muted-foreground">Manage auto parts stock by service center</p>
//         </div>
//         <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Inventory</Button>
//       </div>

//       <Card>
//         <CardHeader>
//           <div className="flex items-center gap-3">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <Input placeholder="Search by center or part..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
//             </div>
//             <Select value={centerFilter} onValueChange={setCenterFilter}>
//               <SelectTrigger className="w-[220px]"><SelectValue placeholder="All centers" /></SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All centers</SelectItem>
//                 {centers.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
//               </SelectContent>
//             </Select>
//             <Select value={partFilter} onValueChange={setPartFilter}>
//               <SelectTrigger className="w-[220px]"><SelectValue placeholder="All parts" /></SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All parts</SelectItem>
//                 {parts.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
//               </SelectContent>
//             </Select>
//           </div>
//         </CardHeader>
//         <CardContent>
//           {loading ? (
//             <div className="text-center py-8">Loading...</div>
//           ) : filtered.length === 0 ? (
//             <div className="text-center py-8 text-muted-foreground">No data</div>
//           ) : (
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Center</TableHead>
//                   <TableHead>Part</TableHead>
//                   <TableHead className="text-right">Quantity</TableHead>
//                   <TableHead className="text-right">Min Stock</TableHead>
//                   <TableHead className="text-right">Recommended Min</TableHead>
//                   <TableHead>Last Forecast</TableHead>
//                   <TableHead>Created</TableHead>
//                   <TableHead className="text-right">Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filtered.map((it) => {
//                   const centerName = typeof it.center_id === 'string' ? it.center_id : (it.center_id.name || "")
//                   const partName = typeof it.part_id === 'string' ? it.part_id : (it.part_id.name || "")
//                   return (
//                     <TableRow key={it._id}>
//                       <TableCell className="font-medium">{centerName}</TableCell>
//                       <TableCell>{partName}</TableCell>
//                       <TableCell className="text-right">{it.quantity}</TableCell>
//                       <TableCell className="text-right">{it.min_stock}</TableCell>
//                       <TableCell className="text-right">{it.recommended_min_stock}</TableCell>
//                       <TableCell>{it.last_forecast_date ? new Date(it.last_forecast_date).toLocaleDateString() : "-"}</TableCell>
//                       <TableCell>{new Date(it.createdAt).toLocaleDateString()}</TableCell>
//                       <TableCell className="text-right">
//                         <div className="flex justify-end gap-2">
//                           <Button variant="ghost" size="sm" onClick={() => openEdit(it)}><Pencil className="h-4 w-4" /></Button>
//                           <Button variant="ghost" size="sm" onClick={() => handleDelete(it._id)} disabled={deletingId === it._id}><Trash2 className="h-4 w-4 text-destructive" /></Button>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   )
//                 })}
//               </TableBody>
//             </Table>
//           )}
//         </CardContent>
//       </Card>

//       <CenterAutoPartDialog open={dialogOpen} onOpenChange={setDialogOpen} record={selected} onSuccess={load} />
//     </div>
//   )
// }
