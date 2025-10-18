"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Sparkles } from "lucide-react"

export function AiSuggestionDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Suggestion
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>AI Inventory Suggestions</DialogTitle>
          <DialogDescription>Smart recommendations based on usage patterns</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-semibold">Reorder Recommendations</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span>Air Filter</span>
                <span className="text-muted-foreground">Order 20 units</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Charging Cable (Type 2)</span>
                <span className="text-muted-foreground">Order 15 units</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Brake Rotor</span>
                <span className="text-muted-foreground">Order 10 units</span>
              </li>
            </ul>
          </div>
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-semibold">Usage Insights</h4>
            <p className="text-sm text-muted-foreground">
              Based on the last 30 days, brake pads are used 40% more frequently than average. Consider increasing
              minimum stock levels.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
