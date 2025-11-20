"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { getApiClient, type CenterRecord } from "@/lib/api"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const { register, user } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"Admin" | "Staff" | "Technician">("Admin")
  const [centers, setCenters] = useState<CenterRecord[]>([])
  const [centerId, setCenterId] = useState<string>("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) router.replace("/")
  }, [user, router])

  useEffect(() => {
    const loadCenters = async () => {
      try {
        const api = getApiClient()
        const res = await api.getCenters({ page: 1, limit: 100 })
        setCenters(res.data.centers)
      } catch (e) {
      }
    }
    loadCenters()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
  await register(email, password, role, centerId)
      router.replace("/login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>Register a new account to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Enter a strong password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                  <SelectItem value="Technician">Technician</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="center">Service Center</Label>
              <Select value={centerId} onValueChange={(v) => setCenterId(v)}>
                <SelectTrigger id="center">
                  <SelectValue placeholder="Select service center" />
                </SelectTrigger>
                <SelectContent>
                  {centers.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name} — {c.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account? {" "}
              <Link href="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
