"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DataPagination } from "@/components/ui/data-pagination"
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
import { AdminOnly } from "@/components/role-guards"
import { StaffDialog } from "@/components/staff/staff-dialog"
import { AddStaffDialog } from "@/components/staff/add-staff-dialog"
import { getApiClient, type SystemUserRecord, type UserAccount } from "@/lib/api"
import { toast } from "sonner"
import { useAuth, useIsAdmin } from "@/components/auth-provider"

export default function StaffPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [systemUsers, setSystemUsers] = useState<SystemUserRecord[]>([])
  const [users, setUsers] = useState<UserAccount[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<SystemUserRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const { user } = useAuth()
  const isAdmin = useIsAdmin()
  const limit = 20

  const loadData = async (page: number) => {
    try {
      setLoading(true)
      const api = getApiClient()
      const userParams: any = { page, limit }
      
      // Filter by user's center for non-admin
      if (!isAdmin && user?.centerId) {
        userParams.centerId = user.centerId
      }
      
      const [sys, us] = await Promise.all([
        api.getSystemUsers(userParams), 
        api.getUsers({ limit: 10 })
      ])
      
      setSystemUsers(sys.data.systemUsers)
      setUsers(us)
      
      const total = sys.data.total || sys.data.systemUsers.length
      setTotalItems(total)
      setTotalPages(Math.ceil(total / limit))
      
      console.log('Staff pagination:', { page, total, totalPages: Math.ceil(total / limit) })
    } catch (e: any) {
      toast.error(e?.message || "Failed to load staff")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(currentPage)
  }, [currentPage])

  const usersById = useMemo(() => new Map(users.map((u) => [u._id, u])), [users])

  const filteredStaff = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return systemUsers.filter((s) => {
      const account = typeof s.userId === "object" ? s.userId : usersById.get(s.userId)
      const name = (s.name || "").toLowerCase()
      const email = (account?.email || "").toLowerCase()
      const role = mapRole(account?.role)
      return name.includes(q) || email.includes(q) || role.toLowerCase().includes(q)
    })
  }, [systemUsers, usersById, searchQuery])

  const handleDeleteClick = (user: SystemUserRecord) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      setDeleting(true)
      const api = getApiClient()
      await api.deleteSystemUser(userToDelete._id)
      
      setSystemUsers((prev) => prev.filter((u) => u._id !== userToDelete._id))
      toast.success("Staff member deleted")
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete staff member")
    } finally {
      setDeleting(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
      case "Staff":
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
      case "Technician":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
      default:
        return ""
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <AdminOnly>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Staff</h1>
            <p className="text-muted-foreground">Manage team members and roles</p>
          </div>
          <AddStaffDialog onSuccess={() => loadData(currentPage)} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {systemUsers.filter((s) => s.isOnline).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Technicians</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {systemUsers.filter(s => {
                  const account = typeof s.userId === "object" ? s.userId : usersById.get(s.userId)
                  return account?.role === "TECHNICIAN"
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Staff Members</CardTitle>
            <CardDescription>View and manage team members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or role..."
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
                    <TableHead>Role</TableHead>
                    <TableHead>Certificates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                        Loading staff...
                      </TableCell>
                    </TableRow>
                  ) : filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                        No staff members found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((s) => {
                      const account = typeof s.userId === "object" ? s.userId : usersById.get(s.userId)
                      const role = mapRole(account?.role)
                      const status = s.isOnline ? "Active" : "Inactive"
                      const name = s.name || (account?.email?.split("@")[0] ?? "—")
                      const certCount = s.certificates?.length || 0
                      return (
                        <TableRow key={s._id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{account?.email || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={getRoleColor(role)}>
                              {role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {certCount > 0 ? (
                              <Badge variant="outline">
                                {certCount} certificate{certCount !== 1 ? "s" : ""}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                status === "Active"
                                  ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                  : "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
                              }
                            >
                              {status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/staff/${s._id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <StaffDialog
                                systemUser={s}
                                trigger={
                                  <Button variant="ghost" size="icon">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                }
                                onSuccess={() => loadData(currentPage)}
                              />
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(s)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination - Always visible */}
            {!loading && totalPages > 0 && (
              <div className="mt-4 flex justify-end">
                <DataPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete staff member "{userToDelete?.name || "this user"}". This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminOnly>
  )
}

function mapRole(apiRole?: string): "Admin" | "Staff" | "Technician" | "Unknown" {
  if (apiRole === "ADMIN") return "Admin"
  if (apiRole === "STAFF") return "Staff"
  if (apiRole === "TECHNICIAN") return "Technician"
  return "Unknown"
}
