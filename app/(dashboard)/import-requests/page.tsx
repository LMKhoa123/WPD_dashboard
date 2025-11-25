"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getApiClient, type ImportRequestRecord, type CenterRecord, type ImportRequestStatus } from "@/lib/api"
import { Search, Plus, Eye, Pencil, Trash2, FileText } from "lucide-react"
import { ImportRequestDialog } from "@/components/import-requests/import-request-dialog"
import { ImportRequestDetailDialog } from "@/components/import-requests/import-request-detail-dialog"
import { useAuth, useIsAdmin } from "@/components/auth-provider"
import { toast } from "sonner"
import { format } from "date-fns"

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-500",
  PENDING: "bg-yellow-500",
  APPROVED: "bg-blue-500",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-red-500",
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  APPROVED: "Approved",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

export default function ImportRequestsPage() {
  const isAdmin = useIsAdmin()
  const { user } = useAuth()
  const api = useMemo(() => getApiClient(), [])

  const [requests, setRequests] = useState<ImportRequestRecord[]>([])
  const [centers, setCenters] = useState<CenterRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 10

  const [centerFilter, setCenterFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [query, setQuery] = useState("")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selected, setSelected] = useState<ImportRequestRecord | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadCenters = useCallback(async () => {
    try {
      const res = await api.getCenters({ limit: 200 })
      setCenters(res.data.centers)
    } catch (error: any) {
      console.error("Failed to load centers:", error)
    }
  }, [api])

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true)
      const params: any = { page, limit }

      if (!isAdmin && user?.centerId) {
        params.center_id = user.centerId
      } else if (centerFilter !== "all") {
        params.center_id = centerFilter
      }

      if (statusFilter !== "all") {
        params.status = statusFilter
      }

      const res = await api.getImportRequests(params)
      setRequests(res.data.requests)
      setTotal(res.data.total)
      setTotalPages(res.data.totalPages)
    } catch (error: any) {
      console.error("Failed to load import requests:", error)
      toast.error("Failed to load import requests")
    } finally {
      setLoading(false)
    }
  }, [api, page, limit, centerFilter, statusFilter, isAdmin, user])

  useEffect(() => {
    loadCenters()
  }, [loadCenters])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const filteredRequests = useMemo(() => {
    if (!query.trim()) return requests
    const lowerQuery = query.toLowerCase()
    return requests.filter((req) => {
      const centerName = typeof req.center_id === "object" ? req.center_id.name : ""
      const staffName = typeof req.staff_id === "object" ? req.staff_id.name : ""
      return (
        centerName.toLowerCase().includes(lowerQuery) ||
        staffName.toLowerCase().includes(lowerQuery) ||
        req.description?.toLowerCase().includes(lowerQuery)
      )
    })
  }, [requests, query])

  const handleCreate = () => {
    setSelected(null)
    setDialogOpen(true)
  }

  const handleEdit = (request: ImportRequestRecord) => {
    setSelected(request)
    setDialogOpen(true)
  }

  const handleViewDetail = (request: ImportRequestRecord) => {
    setSelected(request)
    setDetailDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this import request?")) return
    try {
      setDeletingId(id)
      await api.deleteImportRequest(id)
      toast.success("Import request deleted successfully")
      loadRequests()
    } catch (error: any) {
      console.error("Failed to delete import request:", error)
      toast.error(error.message || "Failed to delete import request")
    } finally {
      setDeletingId(null)
    }
  }

  const handleSaved = () => {
    setDialogOpen(false)
    setSelected(null)
    loadRequests()
  }

  const canEdit = (request: ImportRequestRecord) => {
    // Only allow editing DRAFT or PENDING requests
    return request.status === "DRAFT" || request.status === "PENDING"
  }

  const canDelete = (request: ImportRequestRecord) => {
    // Only allow deleting DRAFT requests
    return request.status === "DRAFT"
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Import Requests</h1>
          <p className="text-muted-foreground mt-1">Manage inventory restock requests</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Request
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import Request List</CardTitle>
          <CardDescription>Search and filter import requests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by center, staff..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {isAdmin && (
              <Select value={centerFilter} onValueChange={setCenterFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Center" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Centers</SelectItem>
                  {centers.map((center) => (
                    <SelectItem key={center._id} value={center._id}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Center</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell className="font-mono text-sm">
                        {request._id.slice(-8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        {typeof request.center_id === "object" ? request.center_id.name : "N/A"}
                      </TableCell>
                      <TableCell>
                        {typeof request.staff_id === "object" ? request.staff_id.name : "N/A"}
                      </TableCell>
                      <TableCell>
                        {request.source_center_id
                          ? typeof request.source_center_id === "object"
                            ? request.source_center_id.name
                            : "N/A"
                          : "Not assigned"}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[request.status] || "bg-gray-500"}>
                          {STATUS_LABELS[request.status] || request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.createdAt), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetail(request)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canEdit(request) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(request)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete(request) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(request._id)}
                              disabled={deletingId === request._id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total} requests
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ImportRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        request={selected}
        onSaved={handleSaved}
      />

      <ImportRequestDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        request={selected}
        onRequestUpdated={loadRequests}
      />
    </div>
  )
}
