"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { mockStaff } from "@/src/lib/mock-data"
import { Search, Pencil, Trash2, Plus } from "lucide-react"
import { AdminOnly } from "@/components/role-guards"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TechnicianScheduler } from "@/components/staff/technician-scheduler"
import { PerformanceDashboard } from "@/components/staff/performance-dashboard"
import { CertificationsManager } from "@/components/staff/certifications"

export default function StaffPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredStaff = mockStaff.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
      case "Technician":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
      case "Staff":
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
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
            <div className="text-2xl font-bold">{mockStaff.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {mockStaff.filter((s) => s.status === "Active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Technicians</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStaff.filter((s) => s.role === "Technician").length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="schedule">Scheduling</TabsTrigger>
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
                {filteredStaff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{member.email}</TableCell>
                    <TableCell className="text-muted-foreground">{member.phone}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getRoleColor(member.role)}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          member.status === "Active"
                            ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                            : "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
                        }
                      >
                        {member.status}
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <TechnicianScheduler />
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
