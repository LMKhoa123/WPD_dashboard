"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth-provider"
import { getApiClient, type ProfileData } from "@/lib/api"
import { toast } from "sonner"
import { Calendar, Mail, Shield, Award, Loader2 } from "lucide-react"
import { formatDateFull, formatDateTime } from "@/lib/utils"

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const api = getApiClient()
      const res = await api.getProfile()
      setProfile(res.data)
    } catch (e: any) {
      toast.error(e?.message || "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const formatDateForDisplay = (isoDate: string | null): string => {
    if (!isoDate) return "Not updated"
    try {
      return formatDateFull(isoDate)
    } catch {
      return "Invalid"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Unable to load profile information.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and account</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Account Info Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>System information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{profile.userId.email}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Role</p>
                <Badge variant={profile.userId.role === "ADMIN" ? "default" : "secondary"} className="mt-1">
                  {profile.userId.role === "ADMIN" ? "Administrator" : "Staff"}
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${profile.isOnline ? "bg-green-500" : "bg-gray-400"}`}
                title={profile.isOnline ? "Online" : "Offline"}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-muted-foreground">{profile.isOnline ? "Online" : "Offline"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Information managed by Admin</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                  {profile.name || <span className="text-muted-foreground">Not updated</span>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date of Birth
                </Label>
                <div className="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                  {formatDateForDisplay(profile.dateOfBirth)}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certification" className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Certification
                </Label>
                <div className="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                  {profile.certification || <span className="text-muted-foreground">No certification</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metadata</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>
            <strong>User ID:</strong> {profile.userId._id}
          </p>
          <p>
            <strong>Profile ID:</strong> {profile._id}
          </p>
          <p>
            <strong>Created At:</strong>{" "}
            {formatDateTime(profile.createdAt)}
          </p>
          <p>
            <strong>Last Updated:</strong>{" "}
            {formatDateTime(profile.updatedAt)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
