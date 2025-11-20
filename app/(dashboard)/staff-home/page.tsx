"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Car, Package, ClipboardCheck, FileText, CreditCard, MessageSquare, Timer } from "lucide-react"
import { AdminOrStaffOnly } from "@/components/role-guards"
import { MyShiftsCalendar } from "@/components/shift-assignments/my-shifts-calendar"
import { useProfile } from "@/hooks/use-profile"

export default function StaffHomePage() {
  const { profile } = useProfile()

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
    <AdminOrStaffOnly>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Staff Home</h1>
          <p className="text-muted-foreground">Daily workflow for intake staff.</p>
        </div>

        {/* My Shifts Calendar - Only show if profile is loaded */}
        {profile?._id && (
          <MyShiftsCalendar systemUserId={profile._id} />
        )}

        <Section title="1) Intake & Scheduling" desc="Create appointments, receive booking requests">
          <Tile href="/appointments" icon={Calendar} label="Appointments" />
          <Tile href="/customers" icon={Users} label="Customers" />
          <Tile href="/vehicles" icon={Car} label="Vehicles" />
        </Section>

        <Section title="2) Assignment & Queue Management" desc="Assign technicians by shift/schedule">
          <Tile href="/shift-assignments" icon={Timer} label="Shift Assignments" />
          <Tile href="/service-records" icon={FileText} label="Service Records" />
          {/* <Tile href="/service-records/board" icon={FileText} label="Status Board (Kanban)" /> */}
        </Section>

        <Section title="3) Checklist & Vehicle Status" desc="Record condition, EV checklist">
          <Tile href="/service-checklists" icon={ClipboardCheck} label="Service Checklists" />
          <Tile href="/chat" icon={MessageSquare} label="Live Chat with Customer" />
        </Section>

        <Section title="4) Parts & Inventory" desc="Track stock, control min stock">
          <Tile href="/center-auto-parts" icon={Package} label="Center Inventory" />
          <Tile href="/inventory" icon={Package} label="Inventory Overview + AI" />
        </Section>

        <Section title="5) Payment" desc="Quote → invoice → payment">
          <Tile href="/payments" icon={CreditCard} label="Payments" />
        </Section>
      </div>
    </AdminOrStaffOnly>
  )
}
