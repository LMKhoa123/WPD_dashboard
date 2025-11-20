"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
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
import { getApiClient, type SystemUserRecord } from "@/lib/api"
import { toast } from "sonner"
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  User, 
  Shield, 
  Award, 
  ExternalLink, 
  AlertCircle,
  Pencil,
  Trash2
} from "lucide-react"
import { AdminOnly } from "@/components/role-guards"
import { StaffDialog } from "@/components/staff/staff-dialog"
import { CertificatesDialog } from "@/components/staff/certificates-dialog"

export default function StaffDetailPage() {
  const params = useParams()
  const router = useRouter()
  const systemUserId = params.id as string

  const [systemUser, setSystemUser] = useState<SystemUserRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const api = getApiClient()
        const data = await api.getSystemUserById(systemUserId)
        setSystemUser(data)
      } catch (e: any) {
        toast.error(e?.message || "Failed to load staff details")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [systemUserId])

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!systemUser) return

    try {
      setDeleting(true)
      const api = getApiClient()
      await api.deleteSystemUser(systemUser._id)
      
      toast.success("Xóa nhân viên thành công")
      router.push("/staff")
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete staff member")
      setDeleting(false)
    }
  }

  const handleUpdateSuccess = (updated?: SystemUserRecord) => {
    if (updated) {
      setSystemUser(updated)
    } else {
      const run = async () => {
        try {
          const api = getApiClient()
          const data = await api.getSystemUserById(systemUserId)
          setSystemUser(data)
        } catch (e: any) {
          toast.error(e?.message || "Failed to load staff details")
        }
      }
      run()
    }
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" })
  }

  const mapRole = (role?: string) => {
    if (role === "ADMIN") return "Admin"
    if (role === "STAFF") return "Staff"
    if (role === "TECHNICIAN") return "Technician"
    return "Unknown"
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-purple-500/10 text-purple-500"
      case "Staff":
        return "bg-blue-500/10 text-blue-500"
      default:
        return ""
    }
  }

  if (loading) {
    return (
      <AdminOnly>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </AdminOnly>
    )
  }

  if (!systemUser) {
    return (
      <AdminOnly>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Staff member not found</h2>
          <Button onClick={() => router.push("/staff")}>Back to Staff</Button>
        </div>
      </AdminOnly>
    )
  }

  const userId = typeof systemUser.userId === "object" ? systemUser.userId : null
  const role = mapRole(userId?.role)

  return (
    <AdminOnly>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/staff")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{systemUser.name || "Unnamed Staff"}</h1>
              <p className="text-muted-foreground">Staff member details and certifications</p>
            </div>
          </div>
          <div className="flex gap-2">
            <StaffDialog
              systemUser={systemUser}
              trigger={
                <Button variant="outline">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              }
              onSuccess={handleUpdateSuccess}
            />
            <Button variant="destructive" onClick={handleDeleteClick}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-sm">{userId?.email || "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge variant="secondary" className={getRoleColor(role)}>
                    {role}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="text-sm">{formatDate(systemUser.dateOfBirth)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge 
                    variant="secondary" 
                    className={systemUser.isOnline ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-500"}
                  >
                    {systemUser.isOnline ? "Online" : "Offline"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-1">Joined</p>
                <p className="text-sm">{formatDate(systemUser.createdAt)}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                <p className="text-sm">{formatDate(systemUser.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Certificates Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Certifications</CardTitle>
                  <CardDescription>Professional certificates and credentials</CardDescription>
                </div>
                <CertificatesDialog
                  systemUser={systemUser}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Award className="h-4 w-4 mr-2" />
                      Manage Certificates
                    </Button>
                  }
                  onSuccess={handleUpdateSuccess}
                />
              </div>
            </CardHeader>
            <CardContent>
              {!systemUser.certificates || systemUser.certificates.length === 0 ? (
                <div className="py-12 text-center">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No certifications added yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {systemUser.certificates.map((cert) => (
                    <Card key={cert._id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-start gap-3">
                              <Award className="h-5 w-5 text-primary mt-0.5" />
                              <div>
                                <h3 className="font-semibold">{cert.name}</h3>
                                <p className="text-sm text-muted-foreground">{cert.issuingOrganization}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pl-8">
                              <div>
                                <p className="text-xs text-muted-foreground">Issue Date</p>
                                <p className="text-sm">{formatDate(cert.issueDate)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Expiration</p>
                                <p className="text-sm">{formatDate(cert.expirationDate)}</p>
                              </div>
                            </div>

                            {cert.credentialUrl && (
                              <div className="pl-8">
                                <a
                                  href={cert.credentialUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  View Credential <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">System User ID</span>
              <span className="font-mono text-xs">{systemUser._id}</span>
            </div>
            {userId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">User Account ID</span>
                <span className="font-mono text-xs">{userId._id}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDate(systemUser.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span>{formatDate(systemUser.updatedAt)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete staff member "{systemUser.name || "this user"}" and all associated data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminOnly>
  )
}
