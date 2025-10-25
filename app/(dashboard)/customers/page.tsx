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
import { getApiClient, type CustomerRecord, type UserAccount } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [users, setUsers] = useState<UserAccount[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<CustomerRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const isAdmin = useIsAdmin()

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const api = getApiClient()
        const [custRes, usersList] = await Promise.all([
          api.getCustomers({ page: 1, limit: 50 }),
          api.getUsers({ limit: 200 }),
        ])
        setCustomers(custRes.data.customers)
        setUsers(usersList)
      } catch (e: any) {
        toast({ title: "Lỗi tải danh sách khách hàng", description: e?.message || "Failed to load customers", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const usersById = useMemo(() => new Map(users.map((u) => [u._id, u])), [users])

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return customers.filter((c) => {
      const u = c.userId ? usersById.get(c.userId._id) : undefined
      const name = (c.customerName || "").toLowerCase()
      const email = (u?.email || "").toLowerCase()
      const phone = u?.phone || ""
      return name.includes(q) || email.includes(q) || phone.includes(searchQuery)
    })
  }, [customers, usersById, searchQuery])

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
      toast({ title: "Xóa khách hàng thành công" })
      setDeleteDialogOpen(false)
      setCustomerToDelete(null)
    } catch (e: any) {
      toast({
        title: "Xóa thất bại",
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
  {isAdmin && <CustomerDialog />}
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
                placeholder="Search by name, email, or phone..."
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
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Vehicles</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((c) => {
                  const u = c.userId ? usersById.get(c.userId._id) : undefined
                  return (
                  <TableRow key={c._id}>
                    <TableCell className="font-medium">{c.customerName || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{u?.email || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{u?.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">—</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
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
