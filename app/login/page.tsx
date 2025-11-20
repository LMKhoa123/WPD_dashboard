"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const { loginWithCredentials, user } = useAuth()

  useEffect(() => {
    if (user) router.replace("/")
  }, [user, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      toast.loading("Signing in...", { id: "login" })
      await loginWithCredentials(identifier, password)
      toast.success("Signed in successfully! 🎉", { id: "login" })
      
      const url = new URL(window.location.href)
      const next = url.searchParams.get("next")
      router.push(next || "/")
    } catch (error: any) {
      toast.error(error?.message || "Sign in failed. Please try again!", { id: "login" })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Zap className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">EV Service Center</CardTitle>
            <CardDescription className="text-base">Sign in to access the management dashboard</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email </Label>
              <Input
                id="identifier"
                type="text"
                placeholder="Enter your email "
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
