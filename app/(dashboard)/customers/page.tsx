"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, Pencil, Trash2, Eye } from "lucide-react"
import { CustomerDialog } from "@/components/customers/customer-dialog"
import { useIsAdmin } from "@/components/auth-provider"
import { getApiClient, type CustomerRecord } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { DataPagination } from "@/components/ui/data-pagination"

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<CustomerRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const isAdmin = useIsAdmin()
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const limit = 20

  const loadCustomers = async (page: number) => {
    try {
      setLoading(true)
      const api = getApiClient()
      const custRes = await api.getCustomers({ page, limit })
      setCustomers(custRes.data.customers)
      setTotalItems(custRes.data.total || customers.length)
      setTotalPages(Math.ceil((custRes.data.total || customers.length) / limit))
    } catch (e: any) {
      toast({ title: "Failed to load customers", description: e?.message || "Failed to load customers", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers(currentPage)
  }, [currentPage])

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return customers.filter((c) => {
      const name = (c.customerName || "").toLowerCase()
      const phone = (c.userId?.phone || "").toLowerCase()
      const address = (c.address || "").toLowerCase()
      return name.includes(q) || phone.includes(q) || address.includes(q)
    })
  }, [customers, searchQuery])

  const handleDeleteClick = (customer: CustomerRecord) => {
    setCustomerToDelete(customer)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return

    try {
      setDeleting(true)
      const api = getApiClient()
      await api.deleteCustomer(customerToDelete._id)
      
      setCustomers((prev) => prev.filter((c) => c._id !== customerToDelete._id))
      toast({ title: "Customer deleted" })
      setDeleteDialogOpen(false)
      setCustomerToDelete(null)
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e?.message || "Failed to delete customer",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleUpdateSuccess = (updated: CustomerRecord) => {
    setCustomers((prev) => prev.map((c) => (c._id === updated._id ? updated : c)))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage customer information and records</p>
        </div>
  {/* {isAdmin && <CustomerDialog />} */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>View and manage customer database</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Loading customers...</div>
          ) : (
          <>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Phone</TableHead>
                  {/* <TableHead>Vehicles</TableHead> */}
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((c) => {
                  return (
                  <TableRow key={c._id}>
                    <TableCell className="font-medium">{c.customerName || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.address || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.userId?.phone || "—"}</TableCell>
                    {/* <TableCell>
                      <Badge variant="secondary">—</Badge>
                    </TableCell> */}
                    <TableCell className="text-muted-foreground">
                      {formatDate(c.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/customers/${c._id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {isAdmin && (
                          <CustomerDialog
                            customer={c}
                            trigger={
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            }
                            onSuccess={handleUpdateSuccess}
                          />
                        )}
                        {isAdmin && (
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(c)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4">
            <DataPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
          </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete customer "{customerToDelete?.customerName}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
