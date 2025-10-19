"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ClipboardList } from "lucide-react"
import type { Appointment } from "@/src/types"

export function EvChecklistDialog({ appointment }: { appointment: Appointment }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<{ [k: string]: boolean }>({
    battery: false,
    brakes: false,
    tires: false,
    software: false,
    cooling: false,
  })
  const [notes, setNotes] = useState("")

  const toggle = (key: string) => setItems((prev) => ({ ...prev, [key]: !prev[key] }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock submit
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="EV Checklist">
          <ClipboardList className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>EV Service Checklist</DialogTitle>
            <DialogDescription>
              Vehicle: {appointment.vehicleName} — Customer: {appointment.customerName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {[
              { key: "battery", label: "Battery health" },
              { key: "brakes", label: "Brake system" },
              { key: "tires", label: "Tire condition" },
              { key: "software", label: "Software/firmware" },
              { key: "cooling", label: "Battery cooling" },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-3">
                <Checkbox checked={!!items[item.key]} onCheckedChange={() => toggle(item.key)} />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Findings..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button type="submit">Save Checklist</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
