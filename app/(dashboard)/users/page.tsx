"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { getApiClient, type UserAccount, type UpdateUserRequest } from "@/lib/api"
import { toast } from "sonner"
import { AdminOnly } from "@/components/role-guards"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { formatDate } from "@/lib/utils"
import { DataPagination } from "@/components/ui/data-pagination"

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserAccount[]>([])
  
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const limit = 20

  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null)

  const [formEmail, setFormEmail] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formRole, setFormRole] = useState<UserAccount["role"]>("STAFF")
  const [formIsDeleted, setFormIsDeleted] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadUsers = async (page: number) => {
    try {
      setLoading(true)
      const api = getApiClient()
      const list = await api.getUsers({ page, limit })
      setUsers(list)
      setTotalItems(list.length >= limit ? page * limit + 1 : (page - 1) * limit + list.length)
      setTotalPages(list.length >= limit ? page + 1 : page)
    } catch (e: any) {
      toast.error(e?.message || "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers(currentPage)
  }, [currentPage])

  const openEditDialog = (u: UserAccount) => {
    setEditingUser(u)
    setFormEmail(u.email || "")
    setFormPassword("")
    setFormRole(u.role)
    setFormIsDeleted(!!u.isDeleted)
    setOpenEdit(true)
  }

  const openDeleteDialog = (u: UserAccount) => {
    setDeletingUser(u)
    setOpenDelete(true)
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return
    try {
      setSaving(true)
      const api = getApiClient()
      const payload: UpdateUserRequest = {}
      if (formEmail !== (editingUser.email || "")) payload.email = formEmail
      if (formPassword.trim()) payload.password = formPassword.trim()
      if (formRole !== editingUser.role) payload.role = formRole
      if (formIsDeleted !== editingUser.isDeleted) payload.isDeleted = formIsDeleted

      const updated = await api.updateUser(editingUser._id, payload)
      setUsers((prev) => prev.map((x) => (x._id === updated._id ? { ...x, ...updated } : x)))
      setOpenEdit(false)
      toast.success(updated.email || updated._id)
      loadUsers(currentPage)  
    } catch (e: any) {
      toast.error(e?.message || "Update user failed")
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingUser) return
    try {
      setSaving(true)
      const api = getApiClient()
      await api.deleteUser(deletingUser._id)
      setUsers((prev) => prev.filter((x) => x._id !== deletingUser._id))
      setOpenDelete(false)
      toast.success(deletingUser.email || deletingUser._id)
      loadUsers(currentPage) 
    } catch (e: any) {
      toast.error(e?.message || "Delete user failed")
    } finally {
      setSaving(false)
    }
  }

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return users.filter((u) => (u.email || "").toLowerCase().includes(q) || (u.phone || "").includes(searchQuery) || (u.role || "").toLowerCase().includes(q))
  }, [users, searchQuery])

  const mapRole = (r: string) => (r === "ADMIN" ? "Admin" : r === "STAFF" ? "Staff" : r === "CUSTOMER" ? "Customer" : r)

  return (
    <AdminOnly>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground">Manage system user accounts</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>View and manage all user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 text-center text-muted-foreground">Loading users...</div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by email, phone, or role..."
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
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((u) => (
                        <TableRow key={u._id}>
                          <TableCell className="text-muted-foreground">{u.email || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{u.phone || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{mapRole(u.role)}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="outline" onClick={() => openEditDialog(u)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(u)}>
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
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
      {/* Edit User Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Password (leave blank to keep current)</Label>
              <Input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="TECHNICIAN">Technician</SelectItem>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-1">
                <Label>Disable (isDeleted)</Label>
                <p className="text-xs text-muted-foreground">Turn on to disable the account.</p>
              </div>
              <Switch checked={formIsDeleted} onCheckedChange={setFormIsDeleted} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone. Are you sure you want to delete this account?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDelete(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={saving}>
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AdminOnly>
  )
}
