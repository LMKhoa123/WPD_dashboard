"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getApiClient, type CenterAutoPartRecord, type CenterRecord, type AutoPartRecord } from "@/lib/api"
import { Search, Pencil, Trash2, Plus, AlertTriangle, Sparkles } from "lucide-react"
import { ForecastResultsDialog } from "@/components/inventory/forecast-results-dialog"
import { cn } from "@/lib/utils"
import { useIsAdmin } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { CenterAutoPartDialog } from "@/components/center-auto-parts/center-auto-part-dialog"

export default function InventoryPage() {
  const isAdmin = useIsAdmin()
  const { toast } = useToast()
  const api = useMemo(() => getApiClient(), [])

  const [items, setItems] = useState<CenterAutoPartRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [centers, setCenters] = useState<CenterRecord[]>([])
  const [parts, setParts] = useState<AutoPartRecord[]>([])

  const [centerFilter, setCenterFilter] = useState<string>("all")
  const [partFilter, setPartFilter] = useState<string>("all")
  const [query, setQuery] = useState("")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState<CenterAutoPartRecord | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [centersRes, partsRes, listRes] = await Promise.all([
        api.getCenters({ limit: 200 }).then(r => r.data.centers),
        api.getAutoParts(1, 200).then(r => r.data.parts),
        api.getCenterAutoParts({ page: 1, limit: 200 }),
      ])
      setCenters(centersRes)
      setParts(partsRes)
      setItems(listRes.data.items)
    } catch (e: any) {
      toast({ title: "Không tải được dữ liệu", description: e?.message || "Failed to load data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [api, toast])

  useEffect(() => { load() }, [load])

  const centersById = useMemo(() => new Map(centers.map((c) => [c._id, c])), [centers])
  const partsById = useMemo(() => new Map(parts.map((p) => [p._id, p])), [parts])

  const filtered = items.filter(it => {
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
      toast({ title: "Đã xóa" })
    } catch (e: any) {
      toast({ title: "Xóa thất bại", description: e?.message || "Failed to delete", variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  type Row = {
    id: string
    name: string // Part name
    centerName: string
    quantity: number
    minStock: number
    recommendedMinStock: number
    price: number
    status: "In Stock" | "Low Stock" | "Out of Stock"
  }

  const rows: Row[] = useMemo(() => {
    return items.map((it) => {
      const centerId = typeof it.center_id === "string" ? it.center_id : it.center_id._id
      const partId = typeof it.part_id === "string" ? it.part_id : it.part_id._id
      const centerName = typeof it.center_id === "string" ? (centersById.get(centerId)?.name || it.center_id) : (it.center_id.name || "")
      const partName = typeof it.part_id === "string" ? (partsById.get(partId)?.name || it.part_id) : (it.part_id.name || "")
      const price = typeof it.part_id === "string" ? (partsById.get(partId)?.selling_price || 0) : (it.part_id.selling_price || 0)
      const qty = it.quantity
      const min = it.min_stock
      const recommendedMinStock = it.recommended_min_stock
      const status: Row["status"] = qty <= 0 ? "Out of Stock" : qty < min ? "Low Stock" : "In Stock"
      return { id: it._id, name: partName, centerName, quantity: qty, minStock: min, recommendedMinStock, price, status }
    })
  }, [items, centersById, partsById])

  const filteredParts = rows.filter((row) => {
    const q = query.toLowerCase()
    return row.name.toLowerCase().includes(q) || row.centerName.toLowerCase().includes(q)
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20"
      case "Low Stock":
        return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
      case "Out of Stock":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Manage auto parts and supplies</p>
        </div>
        <div className="flex gap-2">
          <ForecastResultsDialog 
            trigger={
              <Button variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                AI Suggestion
              </Button>
            }
          />
          {isAdmin && (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Inventory
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Parts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rows.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {rows.filter((r) => r.status === "Low Stock").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {rows.filter((r) => r.status === "Out of Stock").length}
            </div>
          </CardContent>
        </Card>
      </div>

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
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((it) => {
                  const centerName = typeof it.center_id === 'string' ? it.center_id : (it.center_id.name || "")
                  const partName = typeof it.part_id === 'string' ? it.part_id : (it.part_id.name || "")
                  const partId = typeof it.part_id === 'string' ? it.part_id : it.part_id._id
                  const price = partsById.get(partId)?.selling_price || 0
                  const qty = it.quantity
                  const min = it.min_stock
                  const status = qty <= 0 ? "Out of Stock" : qty < min ? "Low Stock" : "In Stock"
                  const statusColor = status === "In Stock" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : status === "Low Stock" ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  return (
                    <TableRow
                      key={it._id}
                      className={cn({
                        "bg-amber-500/5": status === "Low Stock",
                        "bg-red-500/5": status === "Out of Stock",
                      })}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {status === "Low Stock" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                          {status === "Out of Stock" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          {centerName}
                        </div>
                      </TableCell>
                      <TableCell>{partName}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn({ "text-amber-500 font-semibold": qty < min })}>
                          {qty}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{min}</TableCell>
                      <TableCell className="text-right">{it.recommended_min_stock}</TableCell>
                      <TableCell className="text-right">${price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColor}>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(it)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(it._id)} disabled={deletingId === it._id}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

      <CenterAutoPartDialog open={dialogOpen} onOpenChange={setDialogOpen} record={selected} onSuccess={load} />
    </div>
  )
}
