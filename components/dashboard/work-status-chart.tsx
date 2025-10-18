"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cell, Pie, PieChart, ResponsiveContainer, Legend, Tooltip } from "recharts"

const data = [
  { name: "Scheduled", value: 8, color: "hsl(var(--chart-1))" },
  { name: "In Progress", value: 2, color: "hsl(var(--chart-2))" },
  { name: "Completed", value: 3, color: "hsl(var(--chart-4))" },
  { name: "Cancelled", value: 2, color: "hsl(var(--muted-foreground))" },
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
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
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
