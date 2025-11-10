"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getApiClient, type CenterRecord, type WorkshiftRecord } from "@/lib/api"
import { WorkshiftDialog } from "./workshift-dialog"

export default function WorkshiftsManager() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [workshifts, setWorkshifts] = useState<WorkshiftRecord[]>([])
  const [centers, setCenters] = useState<CenterRecord[]>([])
  const [search, setSearch] = useState("")
  const [centerFilter, setCenterFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<WorkshiftRecord | null>(null)

  const centerName = useCallback((id: string) => centers.find(c => c._id === id)?.name || id, [centers])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const api = getApiClient()
      const [ws, cs] = await Promise.all([
        api.getWorkshifts({ center_id: centerFilter !== "all" ? centerFilter : undefined, page, limit }),
        api.getCenters({ page: 1, limit: 200 }),
      ])
      setWorkshifts(ws)
      setCenters(cs.data.centers)
    } catch (e: any) {
      toast({ title: "Không thể tải dữ liệu ca làm", description: e?.message || "Error", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast, centerFilter, page, limit])

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
    if (!confirm(`Xóa ca ${ws.shift_id}?`)) return
    try {
      const api = getApiClient()
      await api.deleteWorkshift(ws._id)
      toast({ title: "Đã xóa" })
      await load()
    } catch (e: any) {
      toast({ title: "Xóa thất bại", description: e?.message || "Error", variant: "destructive" })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Quản lý ca làm việc</CardTitle>
        <div className="flex gap-2">
          <Input placeholder="Tìm theo mã ca" value={search} onChange={(e) => setSearch(e.target.value)} className="w-52" />
          <Select value={centerFilter} onValueChange={setCenterFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Lọc trung tâm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trung tâm</SelectItem>
              {centers.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(limit)} onValueChange={(v) => { setPage(1); setLimit(parseInt(v, 10) || 20) }}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Số dòng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / trang</SelectItem>
              <SelectItem value="20">20 / trang</SelectItem>
              <SelectItem value="50">50 / trang</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={onCreate}>Tạo ca</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Đang tải...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã ca</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Giờ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Trung tâm</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
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
                      <Button size="sm" variant="outline" onClick={() => onEdit(ws)}>Sửa</Button>
                      <Button size="sm" variant="destructive" onClick={() => onDelete(ws)}>Xóa</Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">Không có dữ liệu</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
        {!loading && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-muted-foreground">Trang {page} · Hiển thị {filtered.length} mục</div>
            <div className="space-x-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Trước</Button>
              <Button variant="outline" size="sm" disabled={workshifts.length < limit} onClick={() => setPage(p => p + 1)}>Sau</Button>
            </div>
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
    </Card>
  )
}
