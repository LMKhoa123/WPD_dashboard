"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Pencil, Trash2, Plus } from "lucide-react"
import { useIsAdmin } from "@/components/auth-provider"
import { getApiClient, type VehicleRecord } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"

export default function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([])
  const isAdmin = useIsAdmin()

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const api = getApiClient()
        const list = await api.getVehicles({ limit: 200 })
        setVehicles(list)
      } catch (e: any) {
        toast({ title: "Lỗi tải danh sách xe", description: e?.message || "Failed to load vehicles", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const filteredVehicles = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return vehicles.filter((v) => {
      const owner = typeof v.customerId === "object" && v.customerId ? (v.customerId.customerName || "") : ""
      const vin = (v.VIN || "").toLowerCase()
      return v.vehicleName.toLowerCase().includes(q) || owner.toLowerCase().includes(q) || vin.includes(q)
    })
  }, [vehicles, searchQuery])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground">Manage vehicle registrations and information</p>
        </div>
        {isAdmin && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Vehicles</CardTitle>
          <CardDescription>View and manage registered vehicles</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Loading vehicles...</div>
          ) : (
          <>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by vehicle name, owner, or VIN..."
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
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Model Year</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>VIN</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((v) => (
                  <TableRow key={v._id}>
                    <TableCell className="font-medium">{v.vehicleName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{v.model}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{typeof v.customerId === "object" && v.customerId ? v.customerId.customerName || "—" : "—"}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{v.VIN}</TableCell>
                    <TableCell className="text-right">
                      {isAdmin && (
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
