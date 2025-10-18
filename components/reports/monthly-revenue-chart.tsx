"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

const data = [
  { month: "Jan", revenue: 32000, expenses: 18000 },
  { month: "Feb", revenue: 38000, expenses: 19500 },
  { month: "Mar", revenue: 35000, expenses: 17800 },
  { month: "Apr", revenue: 42000, expenses: 21000 },
  { month: "May", revenue: 45000, expenses: 22500 },
  { month: "Jun", revenue: 48000, expenses: 23000 },
]

export function MonthlyRevenueChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Financial Overview</CardTitle>
        <CardDescription>Revenue and expenses over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-ramp-4)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--chart-ramp-4)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-ramp-2)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--chart-ramp-2)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" stroke="var(--muted-foreground)" />
            <YAxis className="text-xs" stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "var(--foreground)" }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--chart-ramp-4)"
              fillOpacity={1}
              fill="url(#colorRevenue)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="var(--chart-ramp-2)"
              fillOpacity={1}
              fill="url(#colorExpenses)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
