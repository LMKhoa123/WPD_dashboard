"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { getApiClient } from "@/lib/api"
import { formatVND } from "@/lib/utils"

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

interface MonthlyRevenueChartProps {
  date?: Date
}

export function MonthlyRevenueChart({ date }: MonthlyRevenueChartProps) {
  const api = getApiClient()
  const year = date?.getFullYear() || new Date().getFullYear()

  const { data: totalRevenueData = [] } = useQuery({
    queryKey: ["monthlyRevenueChart", year],
    queryFn: () => api.getMonthlyRevenue(year),
  })

  const { data: subscriptionRevenueData = [] } = useQuery({
    queryKey: ["monthlyRevenueChartSubscription", year],
    queryFn: () => api.getMonthlyRevenueBySubscription(year),
  })

  const { data: serviceRevenueData = [] } = useQuery({
    queryKey: ["monthlyRevenueChartService", year],
    queryFn: () => api.getMonthlyRevenueByServiceCompletion(year),
  })

  // Combine data from all three APIs
  const chartData = monthNames.map((monthName, index) => {
    const monthNumber = index + 1
    const subscription = subscriptionRevenueData.find(d => d.month === monthNumber)?.revenue || 0
    const service = serviceRevenueData.find(d => d.month === monthNumber)?.revenue || 0

    return {
      month: monthName,
      subscription,
      service,
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Financial Overview</CardTitle>
        <CardDescription>Revenue breakdown by type for {year}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSubscription" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorService" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
            <XAxis 
              dataKey="month" 
              className="text-xs" 
              stroke="var(--muted-foreground)"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-xs" 
              stroke="var(--muted-foreground)"
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                return value.toString()
              }}
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
              formatter={(value: number, name: string) => [
                formatVND(value),
                name === "subscription" ? "Subscription" : "Service"
              ]}
            />
            <Legend 
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => value === "subscription" ? "Subscription Revenue" : "Service Revenue"}
            />
            <Area
              type="monotone"
              dataKey="service"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorService)"
              strokeWidth={2.5}
              name="service"
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="subscription"
              stroke="#8b5cf6"
              fillOpacity={1}
              fill="url(#colorSubscription)"
              strokeWidth={2.5}
              name="subscription"
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
