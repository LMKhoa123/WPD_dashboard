"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useQuery } from "@tanstack/react-query"
import { getApiClient } from "@/lib/api"

export function TopCustomersTable() {
  const api = getApiClient()

  const { data: customersData } = useQuery({
    queryKey: ["customersForReport"],
    queryFn: async () => {
      const res = await api.getCustomers({ limit: 100 })
      return res.data.customers
    },
  })

  const customers = customersData || []

  // Get initials from customer name
  const getInitials = (name: string) => {
    if (!name || name.trim() === "") return "?"
    return name
      .split(" ")
      .map(word => word[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  // Display first 5 customers
  const displayCustomers = customers.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Customers</CardTitle>
        <CardDescription>Latest registered customers in the system</CardDescription>
      </CardHeader>
      <CardContent>
        {displayCustomers.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No customers found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayCustomers.map((customer) => (
                <TableRow key={customer._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(customer.customerName || "Guest")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {customer.customerName || "Guest User"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {typeof customer.userId === "object" ? customer.userId.email || "-" : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {typeof customer.userId === "object" ? customer.userId.phone || "-" : "-"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    {new Date(customer.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
