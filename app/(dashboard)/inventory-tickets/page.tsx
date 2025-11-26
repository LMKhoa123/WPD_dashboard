"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getApiClient, type InventoryTicketRecord, type CenterRecord, type InventoryTicketStatus } from "@/lib/api"
import { Search, Plus, Eye, Trash2, ArrowDownToLine, ArrowUpFromLine } from "lucide-react"
import { InventoryTicketDialog } from "@/components/inventory-tickets/inventory-ticket-dialog"
import { InventoryTicketDetailDialog } from "@/components/inventory-tickets/inventory-ticket-detail-dialog"
import { useAuth, useIsAdmin } from "@/components/auth-provider"
import { toast } from "sonner"
import { format } from "date-fns"

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500",
  "IN-PROGRESS": "bg-blue-500",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-red-500",
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  "IN-PROGRESS": "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

export default function InventoryTicketsPage() {
  const isAdmin = useIsAdmin()
  const { user } = useAuth()
  const api = useMemo(() => getApiClient(), [])

  const [activeTab, setActiveTab] = useState<"IN" | "OUT">("IN")
  const [tickets, setTickets] = useState<InventoryTicketRecord[]>([])
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
  const [selected, setSelected] = useState<InventoryTicketRecord | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadCenters = useCallback(async () => {
    try {
      const res = await api.getCenters({ limit: 200 })
      setCenters(res.data.centers)
    } catch (error: any) {
      console.error("Failed to load centers:", error)
    }
  }, [api])

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true)
      const params: any = { page, limit, ticket_type: activeTab }

      if (!isAdmin && user?.centerId) {
        params.center_id = user.centerId
      } else if (centerFilter !== "all") {
        params.center_id = centerFilter
      }

      if (statusFilter !== "all") {
        params.status = statusFilter
      }

      const res = await api.getInventoryTickets(params)
      setTickets(res.data.tickets)
      setTotal(res.data.total)
      setTotalPages(res.data.totalPages)
    } catch (error: any) {
      console.error("Failed to load inventory tickets:", error)
      toast.error("Failed to load inventory tickets")
    } finally {
      setLoading(false)
    }
  }, [api, page, limit, activeTab, centerFilter, statusFilter, isAdmin, user])

  useEffect(() => {
    loadCenters()
  }, [loadCenters])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  useEffect(() => {
    // Reset page when switching tabs
    setPage(1)
  }, [activeTab])

  const filteredTickets = useMemo(() => {
    if (!query.trim()) return tickets
    const lowerQuery = query.toLowerCase()
    return tickets.filter((ticket) => {
      const centerName = typeof ticket.center_id === "object" ? ticket.center_id.name : ""
      const createdBy = typeof ticket.created_by === "object" ? ticket.created_by.name : ""
      return (
        ticket.ticket_number.toLowerCase().includes(lowerQuery) ||
        centerName.toLowerCase().includes(lowerQuery) ||
        createdBy.toLowerCase().includes(lowerQuery) ||
        ticket.notes?.toLowerCase().includes(lowerQuery)
      )
    })
  }, [tickets, query])

  const handleCreate = (type: "IN" | "OUT") => {
    setSelected(null)
    setActiveTab(type)
    setDialogOpen(true)
  }

  const handleViewDetail = (ticket: InventoryTicketRecord) => {
    setSelected(ticket)
    setDetailDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return
    try {
      setDeletingId(id)
      await api.deleteInventoryTicket(id)
      toast.success("Ticket deleted successfully")
      loadTickets()
    } catch (error: any) {
      console.error("Failed to delete ticket:", error)
      toast.error(error.message || "Failed to delete ticket")
    } finally {
      setDeletingId(null)
    }
  }

  const handleSaved = () => {
    setDialogOpen(false)
    setSelected(null)
    loadTickets()
  }

  const canDelete = (ticket: InventoryTicketRecord) => {
    return ticket.status === "PENDING"
  }

  const getSourceDisplay = (ticket: InventoryTicketRecord) => {
    if (!ticket.source_type) return "N/A"
    if (ticket.source_type === "SUPPLIER") return "Supplier"
    if (ticket.source_type === "CENTER" && ticket.source_id) {
      return typeof ticket.source_id === "object" ? ticket.source_id.name : "Center"
    }
    return ticket.source_type
  }

  const getDestinationDisplay = (ticket: InventoryTicketRecord) => {
    if (!ticket.destination_type) return "N/A"
    if (ticket.destination_type === "CENTER" && ticket.destination_id) {
      return typeof ticket.destination_id === "object" ? ticket.destination_id.name : "Center"
    }
    // if (ticket.destination_type === "CUSTOMER") return "Customer"
    return ticket.destination_type
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Tickets</h1>
          <p className="text-muted-foreground mt-1">Manage inventory in/out tickets</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "IN" | "OUT")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="IN" className="flex items-center gap-2">
            <ArrowDownToLine className="h-4 w-4" />
            IN Tickets
          </TabsTrigger>
          <TabsTrigger value="OUT" className="flex items-center gap-2">
            <ArrowUpFromLine className="h-4 w-4" />
            OUT Tickets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="IN" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inbound Tickets</CardTitle>
                  <CardDescription>Tickets for receiving inventory</CardDescription>
                </div>
                <Button onClick={() => handleCreate("IN")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create IN Ticket
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ticket number, center..."
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
                      <TableHead>Ticket Number</TableHead>
                      <TableHead>Center</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Created By</TableHead>
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
                    ) : filteredTickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No tickets found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTickets.map((ticket) => (
                        <TableRow key={ticket._id}>
                          <TableCell className="font-mono text-sm">{ticket.ticket_number}</TableCell>
                          <TableCell>
                            {typeof ticket.center_id === "object" ? ticket.center_id.name : "N/A"}
                          </TableCell>
                          <TableCell>{getSourceDisplay(ticket)}</TableCell>
                          <TableCell>
                            {typeof ticket.created_by === "object" ? ticket.created_by.name : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[ticket.status] || "bg-gray-500"}>
                              {STATUS_LABELS[ticket.status] || ticket.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm")}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => handleViewDetail(ticket)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canDelete(ticket) && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(ticket._id)}
                                  disabled={deletingId === ticket._id}
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total} tickets
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
        </TabsContent>

        <TabsContent value="OUT" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Outbound Tickets</CardTitle>
                  <CardDescription>Tickets for shipping inventory</CardDescription>
                </div>
                <Button onClick={() => handleCreate("OUT")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create OUT Ticket
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ticket number, center..."
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
                      <TableHead>Ticket Number</TableHead>
                      <TableHead>Center</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Created By</TableHead>
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
                    ) : filteredTickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No tickets found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTickets.map((ticket) => (
                        <TableRow key={ticket._id}>
                          <TableCell className="font-mono text-sm">{ticket.ticket_number}</TableCell>
                          <TableCell>
                            {typeof ticket.center_id === "object" ? ticket.center_id.name : "N/A"}
                          </TableCell>
                          <TableCell>{getDestinationDisplay(ticket)}</TableCell>
                          <TableCell>
                            {typeof ticket.created_by === "object" ? ticket.created_by.name : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[ticket.status] || "bg-gray-500"}>
                              {STATUS_LABELS[ticket.status] || ticket.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm")}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => handleViewDetail(ticket)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canDelete(ticket) && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(ticket._id)}
                                  disabled={deletingId === ticket._id}
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total} tickets
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
        </TabsContent>
      </Tabs>

      <InventoryTicketDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ticketType={activeTab}
        onSaved={handleSaved}
      />

      <InventoryTicketDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        ticket={selected}
        onTicketUpdated={loadTickets}
      />
    </div>
  )
}
