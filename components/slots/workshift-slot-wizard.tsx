"use client"

import React, { useCallback, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn, formatDate } from "@/lib/utils"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { CalendarIcon, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Users, Wrench } from "lucide-react"
import { toast } from "sonner"
import { getApiClient, type CenterRecord, type WorkshiftRecord, type SystemUserRecord } from "@/lib/api"

interface WizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  centers: CenterRecord[]
  onCompleted?: () => void 
}

type Step = 1 | 2 | 3 | 4

export function WorkshiftSlotWizard({ open, onOpenChange, centers, onCompleted }: WizardProps) {
  const api = useMemo(() => getApiClient(), [])
  const [step, setStep] = useState<Step>(1)

  
  const [centerId, setCenterId] = useState<string>("")
  const [shiftDates, setShiftDates] = useState<Date[]>([])
  const [startTime, setStartTime] = useState("08:00")
  const [endTime, setEndTime] = useState("17:00")
  const [creatingShifts, setCreatingShifts] = useState(false)
  const [createdWorkshifts, setCreatedWorkshifts] = useState<WorkshiftRecord[]>([])

  
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [staff, setStaff] = useState<SystemUserRecord[]>([])
  const [techs, setTechs] = useState<SystemUserRecord[]>([])
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([])
  const [assigning, setAssigning] = useState(false)

  
  const [slotDuration, setSlotDuration] = useState("60")
  const [generatingSlots, setGeneratingSlots] = useState(false)
  const [generateSummary, setGenerateSummary] = useState<{ created: number; skipped: number } | null>(null)

  const resetAll = () => {
    setStep(1)
    setCenterId("")
    setShiftDates([])
    setStartTime("08:00")
    setEndTime("17:00")
    setCreatingShifts(false)
    setCreatedWorkshifts([])
    setLoadingUsers(false)
    setStaff([])
    setTechs([])
    setSelectedStaffIds([])
    setSelectedTechIds([])
    setAssigning(false)
    setSlotDuration("60")
    setGeneratingSlots(false)
    setGenerateSummary(null)
  }

  const closeWizard = () => {
    resetAll()
    onOpenChange(false)
  }

  const toggleDate = (date: Date | undefined) => {
    if (!date) return
    const key = format(date, "yyyy-MM-dd")
    const exists = shiftDates.some(d => format(d, "yyyy-MM-dd") === key)
    setShiftDates(prev => exists ? prev.filter(d => format(d, "yyyy-MM-dd") !== key) : [...prev, date])
  }

  const handleCreateShifts = async () => {
    if (!centerId) { toast.error("Choose a center") ; return }
    if (shiftDates.length === 0) { toast.error("Choose at least one date") ; return }
    setCreatingShifts(true)
    try {
      const payload = {
        shift_dates: shiftDates.map(d => format(d, "yyyy-MM-dd")),
        start_time: startTime,
        end_time: endTime,
        status: "active",
        center_id: centerId,
      }
      const workshifts = await api.createWorkshiftsBulk(payload)
      setCreatedWorkshifts(workshifts)
      toast.success(`Created ${workshifts.length} workshifts successfully`)
      setStep(2)
      await loadUsers(centerId)
    } catch (e: any) {
      toast.error(e?.message || "Failed to create workshifts")
    } finally { setCreatingShifts(false) }
  }

  const loadUsers = useCallback(async (center: string) => {
    setLoadingUsers(true)
    try {
      const [staffRes, techRes] = await Promise.all([
        api.getSystemUsers({ role: "STAFF", centerId: center, page: 1, limit: 200 }),
        api.getSystemUsers({ role: "TECHNICIAN", centerId: center, page: 1, limit: 200 }),
      ])
      setStaff(staffRes.data.systemUsers)
      setTechs(techRes.data.systemUsers)
    } catch (e: any) {
      toast.error("Failed to load users")
    } finally { setLoadingUsers(false) }
  }, [api])

  const toggleSelect = (id: string, list: string[], setter: (ids: string[]) => void) => {
    setter(list.includes(id) ? list.filter(x => x !== id) : [...list, id])
  }

  const handleAssign = async () => {
    if (createdWorkshifts.length === 0) { toast.error("No workshifts created") ; return }
    if (selectedStaffIds.length === 0 && selectedTechIds.length === 0) { toast.error("Select at least one user") ; return }
    setAssigning(true)
    try {
      const workshiftIds = createdWorkshifts.map(w => w._id)
      
      for (const id of [...selectedStaffIds, ...selectedTechIds]) {
        await api.assignShifts({ system_user_id: id, workshift_ids: workshiftIds })
      }
      toast.success("Assigned successfully")
      setStep(3)
    } catch (e: any) {
      toast.error(e?.message || "Failed to assign")
    } finally { setAssigning(false) }
  }

  const handleGenerateSlots = async () => {
    if (!centerId) { toast.error("Missing center") ; return }
    if (creatingShifts || assigning) return 
    
    if (startTime >= endTime) { toast.error("Start time must be before end time") ; return }
    const rawDates = Array.from(new Set(createdWorkshifts.map(w => w.shift_date))).filter(Boolean)
    const normalizedDates = rawDates.map(d => {
      const dt = new Date(d as string)
      if (isNaN(dt.getTime())) return null
      
      return dt.toISOString().slice(0,10)
    }).filter(Boolean) as string[]
    if (normalizedDates.length === 0) { toast.error("No valid dates to generate slots") ; return }
    setGeneratingSlots(true)
    try {
      const res = await api.generateSlots({
        center_ids: [centerId],
        dates: normalizedDates,
        start_time: startTime,
        end_time: endTime,
        duration: parseInt(slotDuration, 10),
      })
      setGenerateSummary({ created: res.data.created, skipped: res.data.skipped })
      toast.success(`Slots: +${res.data.created}, bỏ qua ${res.data.skipped}`)
      setStep(4)
    } catch (e: any) {
      console.error("generateSlots error", e)
      toast.error(e?.message || "Failed to generate slots")
    } finally { setGeneratingSlots(false) }
  }

  const finish = () => {
    if (onCompleted) onCompleted()
    closeWizard()
  }

  const currentCenterName = centers.find(c => c._id === centerId)?.name || "—"

  const StepBadge = ({ n, label }: { n: Step; label: string }) => (
    <div className={cn("flex items-center gap-2 text-sm", step === n ? "font-semibold" : "text-muted-foreground")}> 
      <span className={cn("h-6 w-6 rounded-full flex items-center justify-center border", step === n ? "bg-primary text-primary-foreground border-primary" : "bg-muted")}>{n}</span>
      {label}
      {step > n && <CheckCircle2 className="h-4 w-4 text-green-500" />}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={closeWizard}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Flow: Workshifts → Assign → Slots</DialogTitle>
          <DialogDescription>Automate the process of creating workshifts, assigning users, and generating slots seamlessly.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StepBadge n={1 as Step} label="Create Workshifts" />
            <StepBadge n={2 as Step} label="Assign Users" />
            <StepBadge n={3 as Step} label="Generate Slots" />
            <StepBadge n={4 as Step} label="Complete" />
        </div>
        <Separator className="mb-4" />

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Center *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {centers.map(c => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => setCenterId(c._id)}
                    className={cn("p-3 border rounded-lg text-left hover:bg-accent transition", centerId === c._id && "border-primary bg-primary/10")}
                  >
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.address}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Select Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start w-full md:w-80">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {shiftDates.length === 0 ? "Select Date" : `${shiftDates.length} dates selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0">
                  <Calendar locale={vi} mode="single" selected={undefined} onSelect={toggleDate} initialFocus />
                </PopoverContent>
              </Popover>
              {shiftDates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {shiftDates.sort((a,b)=>a.getTime()-b.getTime()).map(d => {
                    const s = format(d, "dd/MM")
                    return <Badge key={s} variant="secondary" className="px-2 py-1 cursor-pointer" onClick={()=>toggleDate(d)}>{s}</Badge>
                  })}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeWizard}>Cancel</Button>
              <Button onClick={handleCreateShifts} disabled={creatingShifts}>
                {creatingShifts && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Workshifts
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Created Workshifts: {createdWorkshifts.length}</h3>
              <p className="text-sm text-muted-foreground">Center: {currentCenterName}</p>
            </div>
            <ScrollArea className="h-28 border rounded-md p-2 text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {createdWorkshifts.map(ws => (
                  <div key={ws._id} className="p-2 border rounded bg-muted/30">
                    <div className="font-medium">{ws.shift_id}</div>
                    <div>{formatDate(ws.shift_date)}</div>
                    <div>{ws.start_time}-{ws.end_time}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Separator />
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2"><Users className="h-4 w-4" /><h4 className="font-medium">Staff</h4></div>
                <ScrollArea className="h-56 border rounded p-2">
                  <div className="space-y-1">
                    {loadingUsers && <p className="text-xs text-muted-foreground">Loading...</p>}
                    {!loadingUsers && staff.length === 0 && <p className="text-xs text-muted-foreground">No staff available</p>}
                    {staff.map(u => {
                      const active = selectedStaffIds.includes(u._id)
                      return (
                        <button key={u._id} type="button" onClick={()=>toggleSelect(u._id, selectedStaffIds, setSelectedStaffIds)}
                          className={cn("w-full text-left p-2 rounded border text-xs", active ? "bg-primary/10 border-primary" : "hover:bg-accent")}
                        >
                          <p className="font-medium">{u.name || u._id}</p>
                          <p className="text-[10px] text-muted-foreground">{typeof u.userId === "object" ? u.userId.email : ""}</p>
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2"><Wrench className="h-4 w-4" /><h4 className="font-medium">Technicians</h4></div>
                <ScrollArea className="h-56 border rounded p-2">
                  <div className="space-y-1">
                    {loadingUsers && <p className="text-xs text-muted-foreground">Loading...</p>}
                    {!loadingUsers && techs.length === 0 && <p className="text-xs text-muted-foreground">No technicians available</p>}
                    {techs.map(u => {
                      const active = selectedTechIds.includes(u._id)
                      return (
                        <button key={u._id} type="button" onClick={()=>toggleSelect(u._id, selectedTechIds, setSelectedTechIds)}
                          className={cn("w-full text-left p-2 rounded border text-xs", active ? "bg-primary/10 border-primary" : "hover:bg-accent")}
                        >
                          <p className="font-medium">{u.name || u._id}</p>
                          <p className="text-[10px] text-muted-foreground">{typeof u.userId === "object" ? u.userId.email : ""}</p>
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={()=>setStep(1)}><ChevronLeft className="h-4 w-4 mr-1" />Go Back</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeWizard}>Cancel</Button>
                <Button onClick={handleAssign} disabled={assigning}>
                  {assigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Assign
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="font-semibold">Generate Slots based on assigned workshifts</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Center</Label>
                <Input disabled value={currentCenterName} />
              </div>
              <div className="space-y-2">
                <Label>Time Range</Label>
                <Input disabled value={`${startTime} - ${endTime}`} />
              </div>
              <div className="space-y-2">
                <Label>Slot Duration (minutes)</Label>
                <Input type="number" min={5} step={5} value={slotDuration} onChange={e=>setSlotDuration(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(createdWorkshifts.map(w=>w.shift_date))).sort().map(d => (
                  <Badge key={d} variant="secondary" className="px-2 py-1">{formatDate(d)}</Badge>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={()=>setStep(2)}><ChevronLeft className="h-4 w-4 mr-1" />Go Back</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeWizard}>Cancel</Button>
                <Button onClick={handleGenerateSlots} disabled={generatingSlots}>
                  {generatingSlots && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Generate Slots
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Complete 🎉</h3>
              {generateSummary && (
                <p className="text-sm text-muted-foreground">Created {generateSummary.created} slots · Skipped {generateSummary.skipped}</p>
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={()=>setStep(3)}><ChevronLeft className="h-4 w-4 mr-1" />Go Back</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeWizard}>Close</Button>
                <Button onClick={finish}><ChevronRight className="h-4 w-4 mr-1" />Done & Refresh</Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
