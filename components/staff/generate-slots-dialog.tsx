"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format, isValid } from "date-fns"
import { vi } from "date-fns/locale"
import { CalendarIcon, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getApiClient, type CenterRecord } from "@/lib/api"

interface GenerateSlotsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  centers: CenterRecord[]
  onSuccess?: () => void
}

interface GenerateResult {
  created: number
  skipped: number
  slots: any[]
}

export function GenerateSlotsDialog({ open, onOpenChange, centers, onSuccess }: GenerateSlotsDialogProps) {
  const [selectedCenterIds, setSelectedCenterIds] = useState<string[]>([])
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [startTime, setStartTime] = useState("08:00")
  const [endTime, setEndTime] = useState("17:00")
  const [duration, setDuration] = useState("60")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GenerateResult | null>(null)

  const handleCenterToggle = (centerId: string) => {
    setSelectedCenterIds(prev => 
      prev.includes(centerId) 
        ? prev.filter(id => id !== centerId)
        : [...prev, centerId]
    )
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    const dateStr = format(date, "yyyy-MM-dd")
    const exists = selectedDates.some(d => format(d, "yyyy-MM-dd") === dateStr)
    
    if (exists) {
      setSelectedDates(prev => prev.filter(d => format(d, "yyyy-MM-dd") !== dateStr))
    } else {
      setSelectedDates(prev => [...prev, date])
    }
  }

  const removeDateByIndex = (index: number) => {
    setSelectedDates(prev => prev.filter((_, i) => i !== index))
  }

  const hhmmToMinutes = (s: string) => {
    const [h, m] = s.split(":").map(Number)
    if (Number.isNaN(h) || Number.isNaN(m)) return NaN
    return h * 60 + m
  }

  const handleGenerate = async () => {
    if (selectedCenterIds.length === 0) {
      toast.error("Please select at least one center")
      return
    }
    if (selectedDates.length === 0) {
      toast.error("Please select at least one date")
      return
    }

    
    const startMin = hhmmToMinutes(startTime)
    const endMin = hhmmToMinutes(endTime)
    if (!Number.isFinite(startMin) || !Number.isFinite(endMin) || startMin >= endMin) {
      toast.error("Start time must be before end time")
      return
    }

    
    const dates = Array.from(new Set(
      selectedDates
        .filter((d) => isValid(d))
        .map((d) => format(d, "yyyy-MM-dd"))
    ))
    if (dates.length === 0) {
      toast.error("Please select valid dates")
      return
    }

    setLoading(true)
    setResult(null)
    try {
      const api = getApiClient()
      
      const response = await api.generateSlots({
        center_ids: selectedCenterIds,
        dates,
        start_time: startTime,
        end_time: endTime,
        duration: parseInt(duration, 10)
      })

      setResult(response.data)
      toast.success(`Created ${response.data.created} slots, skipped ${response.data.skipped} duplicate slots`)
      
      if (onSuccess) onSuccess()
    } catch (error: any) {
      toast.error(error?.message || "Failed to generate slots. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setSelectedCenterIds([])
      setSelectedDates([])
      setStartTime("08:00")
      setEndTime("17:00")
      setDuration("60")
      setResult(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Slots Automatically</DialogTitle>
          <DialogDescription>
            Create time slots for appointments based on the configured work shifts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Select Center *</Label>
            <div className="grid grid-cols-2 gap-2">
              {centers.map(center => (
                <div
                  key={center._id}
                  onClick={() => handleCenterToggle(center._id)}
                  className={cn(
                    "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors hover:bg-accent",
                    selectedCenterIds.includes(center._id) && "bg-primary/10 border-primary"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedCenterIds.includes(center._id)}
                    onChange={() => {}}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">{center.name}</span>
                </div>
              ))}
            </div>
            {selectedCenterIds.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Selected {selectedCenterIds.length} centers
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Select Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDates.length === 0 
                    ? "Select date..." 
                    : `Selected ${selectedDates.length} dates`
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={undefined}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  locale={vi}
                />
              </PopoverContent>
            </Popover>
            
            {selectedDates.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedDates.sort((a, b) => a.getTime() - b.getTime()).map((date, idx) => (
                  <Badge key={idx} variant="secondary" className="pl-3 pr-1">
                    {format(date, "dd/MM/yyyy")}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeDateByIndex(idx)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration Per Slot (minutes) *</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
                <SelectItem value="120">120 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {result && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Result
              </h4>
              <div className="space-y-1 text-sm text-green-800 dark:text-green-200">
                <p>✓ Created: <span className="font-semibold">{result.created}</span> slots</p>
                <p>⊘ Skipped: <span className="font-semibold">{result.skipped}</span> slots (already exist)</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button onClick={handleGenerate} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Creating..." : "Generate Slots"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
