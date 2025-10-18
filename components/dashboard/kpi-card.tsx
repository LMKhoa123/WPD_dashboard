import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon: React.ReactNode
}

export function KpiCard({ title, value, change, changeType = "neutral", icon }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p
            className={cn("text-xs mt-1", {
              "text-green-500": changeType === "positive",
              "text-red-500": changeType === "negative",
              "text-muted-foreground": changeType === "neutral",
            })}
          >
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
