"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { getApiClient } from "@/lib/api"

const COLORS = ["#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#3b82f6"]

interface RevenueByServiceChartProps {
  date?: Date
}

export function RevenueByServiceChart({ date }: RevenueByServiceChartProps) {
  const api = getApiClient()
  const month = date ? date.getMonth() + 1 : undefined
  const year = date?.getFullYear()

  const { data: subscriptionData = [] } = useQuery({
    queryKey: ["subscriptionCountByPackage", month, year],
    queryFn: () => api.getSubscriptionCountByPackage({ month, year }),
  })

  const chartData = subscriptionData.map(item => ({
    name: item.packageName,
    count: item.count,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscriptions by Package</CardTitle>
        <CardDescription>
          {month && year ? `Distribution for ${new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}` : year ? `Distribution for ${year}` : "All-time distribution"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
            <XAxis
              dataKey="name"
              className="text-xs"
              stroke="var(--muted-foreground)"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 11 }}
              interval={0}
            />
            <YAxis 
              className="text-xs" 
              stroke="var(--muted-foreground)"
              allowDecimals={false}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              labelStyle={{ 
                color: "hsl(var(--foreground))",
                fontWeight: 600,
                marginBottom: "4px"
              }}
              formatter={(value: number) => [`${value} subscriptions`, "Count"]}
            />
            <Bar 
              dataKey="count" 
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
