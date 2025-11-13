"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react"
import { format } from "date-fns"
import { cn, formatVND } from "@/lib/utils"
import { MonthlyRevenueChart } from "@/components/reports/monthly-revenue-chart"
import { RevenueByServiceChart } from "@/components/reports/revenue-by-service-chart"
import { TopCustomersTable } from "@/components/reports/top-customers-table"
import type { DateRange } from "react-day-picker"
import { AdminOnly } from "@/components/role-guards"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function ReportsPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2025, 0, 1),
    to: new Date(2025, 0, 31),
  })

  return (
    <AdminOnly>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Finance</h1>
          <p className="text-muted-foreground">Financial analytics and performance reports</p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
            </PopoverContent>
          </Popover>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$48,250</div>
            <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +18.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$23,100</div>
            <p className="text-xs text-muted-foreground mt-1">Parts and labor costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">$25,150</div>
            <p className="text-xs text-muted-foreground mt-1">52.1% profit margin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Revenue/Customer</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$3,217</div>
            <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +8.4% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <MonthlyRevenueChart />
        <RevenueByServiceChart />
      </div>

      <TopCustomersTable />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Billing Pipeline: Quotes → Invoices → Payments</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Method</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[{q:"Q-1001", c:"Jane Smith", s:"Battery Inspection", a:180, st:"Invoiced", i:"INV-7781", p:"Paid", m:"Online"},
              {q:"Q-1002", c:"John Doe", s:"Brake Service", a:420, st:"Quoted", i:"-", p:"-", m:"-"},
              {q:"Q-1003", c:"Emily Davis", s:"Software Update", a:90, st:"Paid", i:"INV-7784", p:"Paid", m:"Offline"}].map((r)=> (
              <TableRow key={r.q}>
                <TableCell className="font-medium">{r.q}</TableCell>
                <TableCell>{r.c}</TableCell>
                <TableCell>{r.s}</TableCell>
                <TableCell>{formatVND(r.a)}</TableCell>
                <TableCell>{r.st}</TableCell>
                <TableCell>{r.i}</TableCell>
                <TableCell>{r.p}</TableCell>
                <TableCell>{r.m}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
    </AdminOnly>
  )
}
