"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getApiClient, type AutoPartRecord } from "@/lib/api"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { AutoPartDialog } from "@/components/auto-parts/auto-part-dialog"
import { useRole } from "@/components/auth-provider"
import { formatDate, formatVND } from "@/lib/utils"

export default function AutoPartsPage() {
  const { toast } = useToast()
  const role = useRole()
  const [parts, setParts] = useState<AutoPartRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<AutoPartRecord | null>(null)
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [partToDelete, setPartToDelete] = useState<AutoPartRecord | null>(null)

  const loadParts = useCallback(async () => {
    try {
      setLoading(true)
      const apiClient = getApiClient()
      const response = await apiClient.getAutoParts(1, 100)
      setParts(response.data.parts)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to load auto parts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadParts()
  }, [loadParts])

  const filteredParts = useMemo(() => {
    if (!searchQuery) return parts
    const query = searchQuery.toLowerCase()
    return parts.filter(
      (part) =>
        part.name.toLowerCase().includes(query)
    )
  }, [parts, searchQuery])

  const handleCreate = () => {
    setSelectedPart(null)
    setDialogOpen(true)
  }

  const handleEdit = (part: AutoPartRecord) => {
    setSelectedPart(part)
    setDialogOpen(true)
  }

  const handleDeleteClick = (part: AutoPartRecord) => {
    setPartToDelete(part)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!partToDelete) return

    try {
      const apiClient = getApiClient()
      await apiClient.deleteAutoPart(partToDelete._id)
      toast({
        title: "Success",
        description: "Auto part deleted successfully",
      })
      loadParts()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete auto part",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setPartToDelete(null)
    }
  }

  // Stock status logic removed as new backend does not provide quantity/min stock fields

  // Only allow access for Admin
  if (role !== "Admin") {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground">Access Denied</h2>
          <p className="text-muted-foreground mt-2">This page is only accessible to administrators.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Auto Parts Inventory</h1>
          <p className="text-muted-foreground">Manage auto parts inventory and stock levels</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Part
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by part name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredParts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No auto parts found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Name</TableHead>
                  <TableHead className="text-right">Cost Price</TableHead>
                  <TableHead className="text-right">Selling Price</TableHead>
                  <TableHead className="text-right">Warranty (days)</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.map((part) => (
                  <TableRow key={part._id}>
                    <TableCell className="font-medium">{part.name}</TableCell>
                    <TableCell className="text-right">{formatVND(part.cost_price)}</TableCell>
                    <TableCell className="text-right">{formatVND(part.selling_price)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{part.warranty_time} days</Badge>
                    </TableCell>
                    <TableCell>{formatDate(part.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(part)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(part)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AutoPartDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        autoPart={selectedPart}
        onSuccess={loadParts}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the part "{partToDelete?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
