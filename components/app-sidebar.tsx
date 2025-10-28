"use client"

import type * as React from "react"
import { LayoutDashboard, Calendar, Users, Car, Package, UserCog, FileText, Zap, MessageSquare, MapPin, ClipboardCheck, Wrench } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useRole } from "@/components/auth-provider"

const baseNav = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
]

const technicianNav = [
  {
    title: "My Service Records",
    url: "/technician/service-records",
    icon: FileText,
  },
]

const staffNav = [
  {
    title: "Appointments",
    url: "/appointments",
    icon: Calendar,
  },
  {
    title: "Service Records",
    url: "/service-records",
    icon: FileText,
  },
  {
    title: "Service Checklists",
    url: "/service-checklists",
    icon: ClipboardCheck,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Vehicles",
    url: "/vehicles",
    icon: Car,
  },
  {
    title: "Inventory",
    url: "/inventory",
    icon: Package,
  },
  {
    title: "Chat",
    url: "/chat",
    icon: MessageSquare,
  },
]

const adminNav = [
  {
    title: "Appointments",
    url: "/appointments",
    icon: Calendar,
  },
  {
    title: "Service Records",
    url: "/service-records",
    icon: FileText,
  },
  {
    title: "Service Checklists",
    url: "/service-checklists",
    icon: ClipboardCheck,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Vehicles",
    url: "/vehicles",
    icon: Car,
  },
  {
    title: "Inventory",
    url: "/inventory",
    icon: Package,
  },
  { 
    title: "Service Packages", 
    url: "/service-packages", 
    icon: Package 
  },
  { 
    title: "Vehicle Subscriptions", 
    url: "/vehicle-subscriptions", 
    icon: Car 
  },
  { 
    title: "Service Centers", 
    url: "/centers", 
    icon: MapPin 
  },
  { 
    title: "Auto Parts", 
    url: "/auto-parts", 
    icon: Wrench 
  },
  { 
    title: "Users", 
    url: "/users", 
    icon: Users 
  },
  { 
    title: "Staff", 
    url: "/staff", 
    icon: UserCog 
  },
  { 
    title: "Reports", 
    url: "/reports", 
    icon: FileText 
  },
  {
    title: "Center Inventory",
    url: "/center-auto-parts",
    icon: Package,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const role = useRole()

  const navItems = (() => {
    if (role === "Technician") {
      return [...baseNav, ...technicianNav]
    } else if (role === "Staff") {
      return [...baseNav, ...staffNav]
    } else {
      return [...baseNav, ...adminNav]
    }
  })() as { title: string; url: string; icon: any }[]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Zap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">EV Service Center</span>
                  <span className="truncate text-xs text-muted-foreground">Management</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
