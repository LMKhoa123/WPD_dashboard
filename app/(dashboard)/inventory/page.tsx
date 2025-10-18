"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { mockAutoParts } from "@/src/lib/mock-data"
import { Search, Pencil, Trash2, Plus, AlertTriangle } from "lucide-react"
import { AiSuggestionDialog } from "@/components/inventory/ai-suggestion-dialog"
import { cn } from "@/lib/utils"

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredParts = mockAutoParts.filter(
    (part) =>
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.sku.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20"
      case "Low Stock":
        return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
      case "Out of Stock":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Manage auto parts and supplies</p>
        </div>
        <div className="flex gap-2">
          <AiSuggestionDialog />
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Part
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Parts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAutoParts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {mockAutoParts.filter((p) => p.status === "Low Stock").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {mockAutoParts.filter((p) => p.status === "Out of Stock").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Parts</CardTitle>
          <CardDescription>View and manage inventory items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by part name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.map((part) => (
                  <TableRow
                    key={part.id}
                    className={cn({
                      "bg-amber-500/5": part.status === "Low Stock",
                      "bg-red-500/5": part.status === "Out of Stock",
                    })}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {part.status === "Low Stock" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                        {part.status === "Out of Stock" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        {part.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{part.sku}</TableCell>
                    <TableCell>
                      <span className={cn({ "text-amber-500 font-semibold": part.quantity < part.minStock })}>
                        {part.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{part.minStock}</TableCell>
                    <TableCell className="text-muted-foreground">${part.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusColor(part.status)}>
                        {part.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
