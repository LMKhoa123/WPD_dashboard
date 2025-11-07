"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Grid3X3, Calendar, Users, Car, Package, ClipboardCheck, MapPin, UserCog, FileText, CreditCard, MessageSquare } from "lucide-react"
import { AdminOnly } from "@/components/role-guards"

export default function AdminHomePage() {
  const Section = ({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {desc && <CardDescription>{desc}</CardDescription>}
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </CardContent>
    </Card>
  )

  const Tile = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => (
    <Link href={href} className="group">
      <div className="flex items-center justify-between rounded-lg border p-4 transition-colors group-hover:bg-muted">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="font-medium">{label}</div>
        </div>
        <Button variant="outline" size="sm">Open</Button>
      </div>
    </Link>
  )

  return (
    <AdminOnly>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Home</h1>
            <p className="text-muted-foreground">Lối tắt theo flow thiết lập và vận hành trung tâm.</p>
          </div>
        </div>

        <Section title="Thiết lập ban đầu" desc="Thực hiện 1 lần hoặc khi có thay đổi">
          <Tile href="/centers" icon={MapPin} label="Service Centers" />
          <Tile href="/auto-parts" icon={Package} label="Auto Parts Catalog" />
          <Tile href="/center-auto-parts" icon={Grid3X3} label="Center Inventory" />
          <Tile href="/service-checklists" icon={ClipboardCheck} label="EV Service Checklists" />
          <Tile href="/users" icon={Users} label="User Accounts" />
          <Tile href="/staff" icon={UserCog} label="Staff Profiles & Workshifts" />
        </Section>

        <Section title="Vận hành mỗi ngày" desc="Tiếp nhận lịch, phân công, theo dõi tiến độ">
          <Tile href="/appointments" icon={Calendar} label="Appointments & Intake" />
          <Tile href="/shift-assignments" icon={Calendar} label="Shift Assignments" />
          <Tile href="/service-records" icon={FileText} label="Service Records" />
          <Tile href="/service-records/board" icon={FileText} label="Status Board (Kanban)" />
          <Tile href="/chat" icon={MessageSquare} label="Live Chat with Customers" />
        </Section>

        <Section title="Tài chính & Báo cáo" desc="Báo giá, thanh toán, thống kê">
          <Tile href="/payments" icon={CreditCard} label="Payments & Invoices" />
          <Tile href="/reports" icon={FileText} label="Reports & Analytics" />
          <Tile href="/vehicles" icon={Car} label="Vehicles Registry" />
        </Section>
      </div>
    </AdminOnly>
  )
}
