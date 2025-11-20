"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataPagination } from "@/components/ui/data-pagination"
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
import {toast} from "sonner"
import { getApiClient, type AutoPartRecord } from "@/lib/api"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { AutoPartDialog } from "@/components/auto-parts/auto-part-dialog"
import { useRole } from "@/components/auth-provider"
import { formatDate, formatVND } from "@/lib/utils"

export default function AutoPartsPage() {
  const role = useRole()
  const [parts, setParts] = useState<AutoPartRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<AutoPartRecord | null>(null)
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [partToDelete, setPartToDelete] = useState<AutoPartRecord | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const limit = 20

  const loadParts = useCallback(async (page: number) => {
    try {
      setLoading(true)
      const apiClient = getApiClient()
      const response = await apiClient.getAutoParts(page, limit)
      setParts(response.data.parts)
      setTotalItems(response.data.total || response.data.parts.length)
      setTotalPages(Math.ceil((response.data.total || response.data.parts.length) / limit))
    } catch (error: any) {
      toast.error(error?.message || "Failed to load auto parts")
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadParts(currentPage)
  }, [loadParts, currentPage])

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
      toast.success("Auto part deleted successfully")
      loadParts(currentPage)
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete auto part")
    } finally {
      setDeleteDialogOpen(false)
      setPartToDelete(null)
    }
  }


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
        onSuccess={() => loadParts(currentPage)}
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
      
      <div className="mt-4">
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  )
}
