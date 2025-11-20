"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { getApiClient, type CenterRecord, type WorkshiftRecord } from "@/lib/api"
import { WorkshiftDialog } from "./workshift-dialog"
import { GenerateSlotsDialog } from "./generate-slots-dialog"
import { DataPagination } from "@/components/ui/data-pagination"

export default function WorkshiftsManager() {
  const [loading, setLoading] = useState(true)
  const [workshifts, setWorkshifts] = useState<WorkshiftRecord[]>([])
  const [centers, setCenters] = useState<CenterRecord[]>([])
  const [search, setSearch] = useState("")
  const [centerFilter, setCenterFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 20
  const [dialogOpen, setDialogOpen] = useState(false)
  const [generateSlotsOpen, setGenerateSlotsOpen] = useState(false)
  const [editing, setEditing] = useState<WorkshiftRecord | null>(null)

  const centerName = useCallback((id: string) => centers.find(c => c._id === id)?.name || id, [centers])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const api = getApiClient()
      const [ws, cs] = await Promise.all([
        api.getWorkshifts({ center_id: centerFilter !== "all" ? centerFilter : undefined, page: currentPage, limit }),
        api.getCenters({ page: 1, limit: 200 }),
      ])
      setWorkshifts(ws)
      setCenters(cs.data.centers)
      // Assume we need to calculate total pages (API might return total)
      setTotalPages(Math.ceil(ws.length / limit) || 1)
    } catch (e: any) {
  toast.error("Failed to load work shifts. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [centerFilter, currentPage])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    return workshifts.filter(ws => {
      const matchSearch = !search || ws.shift_id.toLowerCase().includes(search.toLowerCase())
      const matchCenter = centerFilter === "all" || ws.center_id === centerFilter
      return matchSearch && matchCenter
    })
  }, [workshifts, search, centerFilter])

  const onCreate = () => { setEditing(null); setDialogOpen(true) }
  const onEdit = (ws: WorkshiftRecord) => { setEditing(ws); setDialogOpen(true) }

  const onDelete = async (ws: WorkshiftRecord) => {
  if (!confirm(`Delete shift ${ws.shift_id}?`)) return
    try {
      const api = getApiClient()
      await api.deleteWorkshift(ws._id)
  toast.success("Shift deleted")
      await load()
    } catch (e: any) {
  toast.error("Delete failed. Please try again.")
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
  <CardTitle>Work Shift Management</CardTitle>
        <div className="flex gap-2">
          <Input placeholder="Search by shift code" value={search} onChange={(e) => setSearch(e.target.value)} className="w-52" />
          <Select value={centerFilter} onValueChange={setCenterFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter center" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All centers</SelectItem>
              {centers.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          
          <Button onClick={onCreate}>Create shift</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shift Code</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Center</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(ws => {
                const d = new Date(ws.shift_date)
                const dateLabel = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
                return (
                  <TableRow key={ws._id}>
                    <TableCell className="font-medium">{ws.shift_id}</TableCell>
                    <TableCell>{dateLabel}</TableCell>
                    <TableCell>{ws.start_time} - {ws.end_time}</TableCell>
                    <TableCell>
                      <Badge variant={ws.status === "active" ? "default" : ws.status === "completed" ? "secondary" : "destructive"}>
                        {ws.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{centerName(ws.center_id)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => onEdit(ws)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => onDelete(ws)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No data</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
        {!loading && workshifts.length > 0 && (
          <div className="mt-4">
            <DataPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </CardContent>

      <WorkshiftDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workshift={editing}
        onSuccess={load}
        centers={centers}
      />

      <GenerateSlotsDialog
        open={generateSlotsOpen}
        onOpenChange={setGenerateSlotsOpen}
        centers={centers}
        onSuccess={load}
      />
    </Card>
  )
}
