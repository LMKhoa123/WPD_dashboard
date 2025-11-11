"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { getApiClient, type UserAccount, type UpdateUserRequest } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { AdminOnly } from "@/components/role-guards"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { formatDate } from "@/lib/utils"

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserAccount[]>([])

  // Edit/Delete dialog state
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null)

  // Edit form state
  const [formEmail, setFormEmail] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formRole, setFormRole] = useState<UserAccount["role"]>("STAFF")
  const [formIsDeleted, setFormIsDeleted] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const api = getApiClient()
        const list = await api.getUsers({ limit: 200 })
        setUsers(list)
      } catch (e: any) {
        toast({ title: "Lỗi tải danh sách users", description: e?.message || "Failed to load users", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

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
      toast({ title: "Đã cập nhật user", description: updated.email || updated._id })
    } catch (e: any) {
      toast({ title: "Cập nhật thất bại", description: e?.message || "Update user failed", variant: "destructive" })
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
      toast({ title: "Đã xóa user", description: deletingUser.email || deletingUser._id })
    } catch (e: any) {
      toast({ title: "Xóa thất bại", description: e?.message || "Delete user failed", variant: "destructive" })
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
              </>
            )}
          </CardContent>
        </Card>
      {/* Edit User Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Mật khẩu (để trống nếu không đổi)</Label>
              <Input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn role" />
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
                <Label>Vô hiệu hóa (isDeleted)</Label>
                <p className="text-xs text-muted-foreground">Bật để vô hiệu hóa tài khoản.</p>
              </div>
              <Switch checked={formIsDeleted} onCheckedChange={setFormIsDeleted} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)} disabled={saving}>
              Hủy
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa user?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Hành động này không thể hoàn tác. Bạn chắc chắn muốn xóa tài khoản này?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDelete(false)} disabled={saving}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={saving}>
              {saving ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AdminOnly>
  )
}
