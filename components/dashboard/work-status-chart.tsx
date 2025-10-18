"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cell, Pie, PieChart, ResponsiveContainer, Legend, Tooltip } from "recharts"

const data = [
  { name: "Scheduled", value: 8, color: "var(--chart-ramp-1)" },
  { name: "In Progress", value: 2, color: "var(--chart-ramp-2)" },
  { name: "Completed", value: 3, color: "var(--chart-ramp-4)" },
  { name: "Cancelled", value: 2, color: "var(--muted-foreground)" },
]

export function WorkStatusChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Status</CardTitle>
        <CardDescription>Distribution of appointment statuses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => <span className="text-sm">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
