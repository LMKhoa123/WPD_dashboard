"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

const data = [
  { service: "Battery Inspection", revenue: 8500 },
  { service: "Tire Rotation", revenue: 4200 },
  { service: "Software Update", revenue: 3800 },
  { service: "Brake Service", revenue: 6700 },
  { service: "Annual Maintenance", revenue: 12400 },
  { service: "Charging System", revenue: 5600 },
]

export function RevenueByServiceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by Service Type</CardTitle>
        <CardDescription>Total revenue breakdown by service category</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="service"
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
