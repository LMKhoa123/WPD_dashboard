"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth-provider"
import { ApiClient, loadTokens, saveTokens, type ProfileData } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { Calendar, Mail, Shield, Award, Loader2 } from "lucide-react"

const api = new ApiClient({ getTokens: loadTokens, setTokens: saveTokens })

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [certification, setCertification] = useState("")

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const res = await api.getProfile()
      setProfile(res.data)
      setName(res.data.name || "")
      setDateOfBirth(res.data.dateOfBirth ? formatDateForInput(res.data.dateOfBirth) : "")
      setCertification(res.data.certification || "")
    } catch (e: any) {
      toast({ title: "Lỗi tải profile", description: e?.message || "Failed to load profile", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const res = await api.updateProfile({
        name: name.trim() || undefined,
        dateOfBirth: dateOfBirth || null,
        certification: certification.trim() || undefined,
      })
      setProfile(res.data)
      setIsEditing(false)
      toast({ title: "Cập nhật thành công", description: res.message })
    } catch (e: any) {
      toast({ title: "Cập nhật thất bại", description: e?.message || "Update failed", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setName(profile.name || "")
      setDateOfBirth(profile.dateOfBirth ? formatDateForInput(profile.dateOfBirth) : "")
      setCertification(profile.certification || "")
    }
    setIsEditing(false)
  }

  // Format ISO date to yyyy-MM-dd for input[type=date]
  const formatDateForInput = (isoDate: string): string => {
    try {
      return isoDate.split("T")[0]
    } catch {
      return ""
    }
  }

  // Format for display
  const formatDateForDisplay = (isoDate: string | null): string => {
    if (!isoDate) return "Chưa cập nhật"
    try {
      const d = new Date(isoDate)
      return d.toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" })
    } catch {
      return "Không hợp lệ"
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
          <p className="text-muted-foreground">Không thể tải thông tin profile.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Quản lý thông tin cá nhân và tài khoản của bạn</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Account Info Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Thông tin tài khoản</CardTitle>
            <CardDescription>Thông tin hệ thống</CardDescription>
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
                <p className="text-sm font-medium">Trạng thái</p>
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
                <CardTitle>Thông tin cá nhân</CardTitle>
                <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  Chỉnh sửa
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    type="text"
                    placeholder="Nhập họ tên của bạn"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                ) : (
                  <div className="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                    {profile.name || <span className="text-muted-foreground">Chưa cập nhật</span>}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ngày sinh
                </Label>
                {isEditing ? (
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                ) : (
                  <div className="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                    {formatDateForDisplay(profile.dateOfBirth)}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="certification" className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Chứng chỉ
                </Label>
                {isEditing ? (
                  <Input
                    id="certification"
                    type="text"
                    placeholder="Ví dụ: EV Technician Level 2"
                    value={certification}
                    onChange={(e) => setCertification(e.target.value)}
                  />
                ) : (
                  <div className="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                    {profile.certification || <span className="text-muted-foreground">Chưa có chứng chỉ</span>}
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      "Lưu thay đổi"
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
                    Hủy
                  </Button>
                </div>
              )}
            </form>
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
            <strong>Ngày tạo:</strong>{" "}
            {new Date(profile.createdAt).toLocaleString("vi-VN", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p>
            <strong>Cập nhật lần cuối:</strong>{" "}
            {new Date(profile.updatedAt).toLocaleString("vi-VN", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
