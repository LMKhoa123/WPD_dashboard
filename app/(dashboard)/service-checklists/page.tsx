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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getApiClient, type ServiceChecklistRecord } from "@/lib/api"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { ServiceChecklistDialog } from "@/components/service-checklists/service-checklist-dialog"
import { AdminOnly } from "@/components/role-guards"

export default function ServiceChecklistsPage() {
  const { toast } = useToast()
  const [checklists, setChecklists] = useState<ServiceChecklistRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedChecklist, setSelectedChecklist] = useState<ServiceChecklistRecord | null>(null)
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [checklistToDelete, setChecklistToDelete] = useState<ServiceChecklistRecord | null>(null)

  const loadChecklists = useCallback(async () => {
    try {
      setLoading(true)
      const apiClient = getApiClient()
      const response = await apiClient.getServiceChecklists(1, 100)
      setChecklists(response.data.checklists)
    } catch (error: any) {
      toast({
        title: "Lỗi tải danh sách",
        description: error?.message || "Failed to load service checklists",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadChecklists()
  }, [loadChecklists])

  const filteredChecklists = useMemo(() => {
    if (!searchQuery) return checklists.sort((a, b) => a.order - b.order)
    const query = searchQuery.toLowerCase()
    return checklists
      .filter((checklist) => checklist.name.toLowerCase().includes(query))
      .sort((a, b) => a.order - b.order)
  }, [checklists, searchQuery])

  const handleCreate = () => {
    setSelectedChecklist(null)
    setDialogOpen(true)
  }

  const handleEdit = (checklist: ServiceChecklistRecord) => {
    setSelectedChecklist(checklist)
    setDialogOpen(true)
  }

  const handleDeleteClick = (checklist: ServiceChecklistRecord) => {
    setChecklistToDelete(checklist)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!checklistToDelete) return

    try {
      const apiClient = getApiClient()
      await apiClient.deleteServiceChecklist(checklistToDelete._id)
      toast({
        title: "Xóa thành công",
        description: "Service checklist đã được xóa",
      })
      loadChecklists()
    } catch (error: any) {
      toast({
        title: "Xóa thất bại",
        description: error?.message || "Failed to delete service checklist",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setChecklistToDelete(null)
    }
  }

  return (
    <AdminOnly>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Service Checklists</h1>
            <p className="text-muted-foreground">Quản lý các mẫu checklist bảo dưỡng (Admin only)</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Checklist
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by checklist name..."
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
            ) : filteredChecklists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No service checklists found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChecklists.map((checklist) => (
                    <TableRow key={checklist._id}>
                      <TableCell className="font-medium">{checklist.order}</TableCell>
                      <TableCell className="font-medium">{checklist.name}</TableCell>
                      <TableCell>
                        {new Date(checklist.createdAt).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell>
                        {new Date(checklist.updatedAt).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(checklist)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(checklist)}
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

        <ServiceChecklistDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          checklist={selectedChecklist}
          onSuccess={loadChecklists}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn chắc chắn muốn xóa checklist "{checklistToDelete?.name}"?
                Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm}>
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminOnly>
  )
}
