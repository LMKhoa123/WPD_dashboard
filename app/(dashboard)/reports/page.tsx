"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { MonthPicker } from "@/components/ui/month-picker"
import { YearPicker } from "@/components/ui/year-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react"
import { format } from "date-fns"
import { cn, formatVND } from "@/lib/utils"
import { MonthlyRevenueChart } from "@/components/reports/monthly-revenue-chart"
import { RevenueByServiceChart } from "@/components/reports/revenue-by-service-chart"
import { TopCustomersTable } from "@/components/reports/top-customers-table"
import type { DateRange } from "react-day-picker"
import { AdminOnly } from "@/components/role-guards"
import { useQuery } from "@tanstack/react-query"
import { getApiClient } from "@/lib/api"

export default function ReportsPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2025, 0, 1),
    to: new Date(2025, 0, 31),
  })

  const [cardsDate, setCardsDate] = useState<Date>(new Date())
  const [monthlyChartDate, setMonthlyChartDate] = useState<Date>(new Date())
  const [serviceChartDate, setServiceChartDate] = useState<Date>(new Date())

  const api = getApiClient()
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1 
  
  const cardsYear = cardsDate.getFullYear()
  const cardsMonth = cardsDate.getMonth() + 1

  const { data: totalRevenue = 0 } = useQuery({
    queryKey: ["totalRevenue"],
    queryFn: () => api.getTotalRevenue(),
  })

  const { data: totalRevenueSubscription = 0 } = useQuery({
    queryKey: ["totalRevenueSubscription"],
    queryFn: () => api.getTotalRevenueBySubscription(),
  })

  const { data: totalRevenueService = 0 } = useQuery({
    queryKey: ["totalRevenueService"],
    queryFn: () => api.getTotalRevenueByServiceCompletion(),
  })

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await api.getCustomers({ limit: 500 })
      return res.data.customers
    },
  })

  const { data: monthlyRevenue = [] } = useQuery({
    queryKey: ["monthlyRevenue", cardsYear],
    queryFn: () => api.getMonthlyRevenue(cardsYear),
  })

  const { data: monthlyRevenueSubscription = [] } = useQuery({
    queryKey: ["monthlyRevenueSubscription", cardsYear],
    queryFn: () => api.getMonthlyRevenueBySubscription(cardsYear),
  })

  const { data: monthlyRevenueService = [] } = useQuery({
    queryKey: ["monthlyRevenueService", cardsYear],
    queryFn: () => api.getMonthlyRevenueByServiceCompletion(cardsYear),
  })

  const calculatePercentageChange = (data: { month: number; revenue: number }[], month: number) => {
    const currentMonthData = data.find(d => d.month === month)
    const lastMonthData = data.find(d => d.month === month - 1)
    
    if (!currentMonthData || !lastMonthData || lastMonthData.revenue === 0) {
      return null
    }
    
    return ((currentMonthData.revenue - lastMonthData.revenue) / lastMonthData.revenue) * 100
  }

  const totalRevenueChange = useMemo(() => calculatePercentageChange(monthlyRevenue, cardsMonth), [monthlyRevenue, cardsMonth])
  const subscriptionRevenueChange = useMemo(() => calculatePercentageChange(monthlyRevenueSubscription, cardsMonth), [monthlyRevenueSubscription, cardsMonth])
  const serviceRevenueChange = useMemo(() => calculatePercentageChange(monthlyRevenueService, cardsMonth), [monthlyRevenueService, cardsMonth])

  return (
    <AdminOnly>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Finance</h1>
          <p className="text-muted-foreground">Financial analytics and performance reports</p>
        </div>
        <div className="flex gap-2">
          {/* <Popover>
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
          </Popover> */}
          {/* <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button> */}
        </div>
      </div>

      {/* Cards Date Picker */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Cards Period:</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-left font-normal w-[240px]", !cardsDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {cardsDate ? format(cardsDate, "MMMM yyyy") : <span>Pick a month</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <MonthPicker selected={cardsDate} onSelect={(date) => date && setCardsDate(date)} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatVND(totalRevenue)}</div>
            <p className={cn("text-xs flex items-center gap-1 mt-1", totalRevenueChange !== null ? (totalRevenueChange >= 0 ? "text-green-500" : "text-red-500") : "text-muted-foreground")}>
              {totalRevenueChange !== null && (totalRevenueChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />)}
              {totalRevenueChange !== null ? `${totalRevenueChange >= 0 ? "+" : ""}${totalRevenueChange.toFixed(1)}%` : "N/A"} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subscription Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatVND(totalRevenueSubscription)}</div>
            <p className={cn("text-xs flex items-center gap-1 mt-1", subscriptionRevenueChange !== null ? (subscriptionRevenueChange >= 0 ? "text-green-500" : "text-red-500") : "text-muted-foreground")}>
              {subscriptionRevenueChange !== null && (subscriptionRevenueChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />)}
              {subscriptionRevenueChange !== null ? `${subscriptionRevenueChange >= 0 ? "+" : ""}${subscriptionRevenueChange.toFixed(1)}%` : "N/A"} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Service Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatVND(totalRevenueService)}</div>
            <p className={cn("text-xs flex items-center gap-1 mt-1", serviceRevenueChange !== null ? (serviceRevenueChange >= 0 ? "text-green-500" : "text-red-500") : "text-muted-foreground")}>
              {serviceRevenueChange !== null && (serviceRevenueChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />)}
              {serviceRevenueChange !== null ? `${serviceRevenueChange >= 0 ? "+" : ""}${serviceRevenueChange.toFixed(1)}%` : "N/A"} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered customers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Monthly Chart:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal w-[200px]", !monthlyChartDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {monthlyChartDate ? format(monthlyChartDate, "yyyy") : <span>Pick a year</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <YearPicker selected={monthlyChartDate} onSelect={(date) => date && setMonthlyChartDate(date)} />
              </PopoverContent>
            </Popover>
          </div>
          <MonthlyRevenueChart date={monthlyChartDate} />
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Service Chart:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal w-[200px]", !serviceChartDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {serviceChartDate ? format(serviceChartDate, "MMMM yyyy") : <span>Pick a month</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <MonthPicker selected={serviceChartDate} onSelect={(date) => date && setServiceChartDate(date)} />
              </PopoverContent>
            </Popover>
          </div>
          <RevenueByServiceChart date={serviceChartDate} />
        </div>
      </div>

      <TopCustomersTable />
    </div>
    </AdminOnly>
  )
}
