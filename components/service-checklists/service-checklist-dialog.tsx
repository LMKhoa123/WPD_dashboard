"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getApiClient } from "@/lib/api"
import type { ServiceChecklistRecord, ServiceChecklistStatus, ServiceRecordRecord } from "@/lib/api"

interface ServiceChecklistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  checklist: ServiceChecklistRecord | null
  onSuccess: () => void
}

export function ServiceChecklistDialog({
  open,
  onOpenChange,
  checklist,
  onSuccess,
}: ServiceChecklistDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [serviceRecords, setServiceRecords] = useState<ServiceRecordRecord[]>([])
  
  const [recordId, setRecordId] = useState("")
  const [name, setName] = useState("")
  const [status, setStatus] = useState<ServiceChecklistStatus>("pending")
  const [note, setNote] = useState("")

  const isEditMode = !!checklist

  useEffect(() => {
    if (open) {
      loadServiceRecords()
    }
  }, [open])

  useEffect(() => {
    if (open && isEditMode && checklist) {
      setRecordId(typeof checklist.record_id === 'object' && checklist.record_id ? checklist.record_id._id : (checklist.record_id as string) || "")
      setName(checklist.name || "")
      setStatus(checklist.status || "pending")
      setNote(checklist.note || "")
    } else if (!open) {
      resetForm()
    }
  }, [open, isEditMode, checklist])

  const resetForm = () => {
    setRecordId("")
    setName("")
    setStatus("pending")
    setNote("")
  }

  const loadServiceRecords = async () => {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.getServiceRecords({ page: 1, limit: 100 })
      setServiceRecords(response.data.records)
    } catch (error) {
      console.error("Failed to load service records:", error)
      toast({
        title: "Error",
        description: "Failed to load service records",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const apiClient = getApiClient()
      if (isEditMode && checklist) {
        await apiClient.updateServiceChecklist(checklist._id, {
          record_id: recordId || undefined,
          name,
          status,
          note: note || undefined,
        })
        toast({
          title: "Success",
          description: "Service checklist updated successfully",
        })
      } else {
        await apiClient.createServiceChecklist({
          record_id: recordId,
          name,
          status,
          note: note || undefined,
        })
        toast({
          title: "Success",
          description: "Service checklist created successfully",
        })
      }
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Service Checklist" : "Create Service Checklist"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="record_id">Service Record *</Label>
            <Select value={recordId} onValueChange={setRecordId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select service record" />
              </SelectTrigger>
              <SelectContent>
                {serviceRecords.map((record) => {
                  const technicianName = typeof record.technician_id === 'object' && record.technician_id 
                    ? (record.technician_id.name || record.technician_id.email || record.technician_id._id)
                    : record.technician_id
                  return (
                    <SelectItem key={record._id} value={record._id}>
                      {technicianName} - {record.description.substring(0, 50)}
                      {record.description.length > 50 ? "..." : ""}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Checklist Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Oil Change, Tire Rotation"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select value={status} onValueChange={(val) => setStatus(val as ServiceChecklistStatus)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditMode ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
