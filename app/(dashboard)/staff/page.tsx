"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Pencil, Trash2, Plus } from "lucide-react"
import { AdminOnly } from "@/components/role-guards"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdvancedScheduler } from "@/components/staff/advanced-scheduler"
import ShiftScheduler from "@/components/staff/shift-scheduler"
import { PerformanceDashboard } from "@/components/staff/performance-dashboard"
import { CertificationsManager } from "@/components/staff/certifications"
import { getApiClient, type SystemUserRecord, type UserAccount } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"

export default function StaffPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [systemUsers, setSystemUsers] = useState<SystemUserRecord[]>([])
  const [users, setUsers] = useState<UserAccount[]>([])

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const api = getApiClient()
        const [sys, us] = await Promise.all([api.getSystemUsers({ limit: 200 }), api.getUsers({ limit: 200 })])
        setSystemUsers(sys.data.systemUsers)
        setUsers(us)
      } catch (e: any) {
        toast({ title: "Lỗi tải danh sách nhân sự", description: e?.message || "Failed to load staff", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const usersById = useMemo(() => new Map(users.map((u) => [u._id, u])), [users])

  const filteredStaff = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return systemUsers.filter((s) => {
      const account = usersById.get(s.userId)
      const name = (s.name || "").toLowerCase()
      const email = (account?.email || "").toLowerCase()
      const role = mapRole(account?.role)
      return name.includes(q) || email.includes(q) || role.toLowerCase().includes(q)
    })
  }, [systemUsers, usersById, searchQuery])

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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemUsers.length}</div>
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
            <div className="text-2xl font-bold">{/* unknown technicians from API */}0</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="schedule">Scheduling</TabsTrigger>
          <TabsTrigger value="shift">Shift (DnD Sidebar)</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="certs">Certifications</TabsTrigger>
        </TabsList>

        <TabsContent value="team">
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
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">Loading staff...</TableCell>
                  </TableRow>
                ) : filteredStaff.map((s) => {
                  const account = usersById.get(s.userId)
                  const role = mapRole(account?.role)
                  const status = s.isOnline ? "Active" : "Inactive"
                  const name = s.name || (account?.email?.split("@")[0] ?? "—")
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
                    <TableCell className="text-muted-foreground">{account?.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getRoleColor(role)}>
                        {role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={status === "Active" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"}
                      >
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <AdvancedScheduler />
        </TabsContent>

        <TabsContent value="shift">
          <ShiftScheduler />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceDashboard />
        </TabsContent>

        <TabsContent value="certs">
          <CertificationsManager />
        </TabsContent>
      </Tabs>
      </div>
    </AdminOnly>
  )
}

function mapRole(apiRole?: string): "Admin" | "Staff" | "Technician" | "Unknown" {
  if (apiRole === "ADMIN") return "Admin"
  if (apiRole === "STAFF") return "Staff"
  return "Unknown"
}
