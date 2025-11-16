"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface YearPickerProps {
  selected?: Date
  onSelect?: (date: Date) => void
}

export function YearPicker({ selected, onSelect }: YearPickerProps) {
  const currentYear = new Date().getFullYear()
  const selectedYear = selected?.getFullYear() || currentYear
  const startYear = Math.floor((selectedYear - 1) / 12) * 12

  const years = Array.from({ length: 12 }, (_, i) => startYear + i)

  const handleYearClick = (year: number) => {
    if (year > currentYear) return
    const newDate = new Date(year, 0, 1)
    onSelect?.(newDate)
  }

  const goToPreviousDecade = () => {
    const newYear = startYear - 12
    const newDate = new Date(newYear, 0, 1)
    onSelect?.(newDate)
  }

  const goToNextDecade = () => {
    const newYear = startYear + 12
    if (newYear <= currentYear) {
      const newDate = new Date(newYear, 0, 1)
      onSelect?.(newDate)
    }
  }

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={goToPreviousDecade}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold">
          {startYear} - {startYear + 11}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={goToNextDecade}
          disabled={startYear + 12 > currentYear}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {years.map((year) => {
          const disabled = year > currentYear
          const isSelected = year === selectedYear
          return (
            <Button
              key={year}
              variant="outline"
              disabled={disabled}
              className={cn(
                "h-9 text-sm",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => handleYearClick(year)}
            >
              {year}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
