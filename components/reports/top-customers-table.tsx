"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const topCustomers = [
  { name: "Michael Johnson", visits: 12, revenue: 8450, initials: "MJ" },
  { name: "James Taylor", visits: 9, revenue: 7200, initials: "JT" },
  { name: "Christopher Lee", visits: 8, revenue: 6800, initials: "CL" },
  { name: "Kevin Rodriguez", visits: 7, revenue: 5900, initials: "KR" },
  { name: "Robert Wilson", visits: 6, revenue: 4750, initials: "RW" },
]

export function TopCustomersTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Customers</CardTitle>
        <CardDescription>Highest revenue generating customers</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Visits</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topCustomers.map((customer) => (
              <TableRow key={customer.name}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {customer.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{customer.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{customer.visits}</TableCell>
                <TableCell className="text-right font-semibold">${customer.revenue.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
