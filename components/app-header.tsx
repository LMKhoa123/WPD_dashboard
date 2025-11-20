"use client"

import { Bell, Search, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/components/auth-provider"
import { useEffect, useState } from "react"

import { useSocket } from "@/lib/useSocket"
import { formatDateTime } from "@/lib/utils"

import { getApiClient } from "@/lib/api"

import { useRouter } from "next/navigation"
import Link from "next/link"

export function AppHeader() {
  const { user, logout } = useAuth()
  const [centerName, setCenterName] = useState<string>("")
  const [centerLoading, setCenterLoading] = useState(false)

  useEffect(() => {
    const loadCenter = async () => {
      if (!user) return
      const roleLower = user.role?.toLowerCase()
      if ((roleLower === "staff" || roleLower === "technician") && (user as any).centerId) {
        try {
          setCenterLoading(true)
          const api = getApiClient()
          const center = await api.getCenterById((user as any).centerId as string)
          setCenterName(center?.name || "")
        } catch (e) {
          setCenterName("")
        } finally {
          setCenterLoading(false)
        }
      } else {
        setCenterName("")
      }
    }
    loadCenter()
  }, [user])
  const router = useRouter()
  const { on } = useSocket()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Array<{ id: string; type: string; title: string; message: string; meta?: any; createdAt: string }>>([])
  const unreadCount = notifications.length


  useEffect(() => {
    const handleNotification = (data: any) => {
      console.log('📢 Notification received:', data)
      setNotifications(prev => [{
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: data?.type || 'notification',
        title: data?.title || 'Thông báo',
        message: data?.message || '',
        meta: data?.meta,
        createdAt: new Date().toISOString()
      }, ...prev].slice(0, 50))
    }

    on('notification:new', handleNotification)

    return () => {
    }
  }, [on])

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <SidebarTrigger className="-ml-2" />

      <div className="flex-1 flex items-center gap-4">
        <form className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search customers, vehicles, appointments..."
              className="pl-10 bg-muted/50"
            />
          </div>
        </form>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0 -right-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-accent-foreground">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No notifications</div>
            )}
            {notifications.map(n => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 whitespace-normal">
                <div className="flex w-full justify-between text-xs font-medium">
                  <span>{n.title}</span>
                  <span className="text-muted-foreground">{formatDateTime(n.createdAt)}</span>
                </div>
                <div className="text-xs text-muted-foreground">{n.message}</div>
                {n.meta?.part_id && (
                  <div className="text-[10px] text-muted-foreground/70">Part: {n.meta.part_id}</div>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {(user?.role === "Staff" || user?.role === "Technician") && (
          <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs font-medium max-w-[160px]" title={centerName || "Chưa có trung tâm"}>
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            {centerLoading ? (
              <span className="italic text-muted-foreground">Loading...</span>
            ) : centerName ? (
              <span className="truncate">{centerName}</span>
            ) : (
              <span className="text-muted-foreground">No center assigned</span>
            )}
          </div>
        )}


        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "--"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start text-sm">
                <span className="font-medium">{user?.name || "Guest"}</span>
                <span className="text-xs text-muted-foreground">Role: {user?.role === "Admin" ? "Administrator" : "Staff"}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
            {/* <DropdownMenuItem>Settings</DropdownMenuItem> */}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
