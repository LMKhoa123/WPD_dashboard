"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { getApiClient, type UserAccount } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { AdminOnly } from "@/components/role-guards"

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserAccount[]>([])

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
                          <TableCell className="text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminOnly>
  )
}
