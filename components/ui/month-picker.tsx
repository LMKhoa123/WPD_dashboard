"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MonthPickerProps {
  selected?: Date
  onSelect?: (date: Date) => void
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export function MonthPicker({ selected, onSelect }: MonthPickerProps) {
  const [year, setYear] = React.useState(selected?.getFullYear() || new Date().getFullYear())
  const selectedMonth = selected?.getMonth()
  const selectedYear = selected?.getFullYear()

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const isMonthDisabled = (monthIndex: number) => {
    if (year > currentYear) return true
    if (year === currentYear && monthIndex > currentMonth) return true
    return false
  }

  const handleMonthClick = (monthIndex: number) => {
    if (isMonthDisabled(monthIndex)) return
    const newDate = new Date(year, monthIndex, 1)
    onSelect?.(newDate)
  }

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => setYear(year - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold">{year}</div>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => setYear(year + 1)}
          disabled={year >= currentYear}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {months.map((month, index) => {
          const disabled = isMonthDisabled(index)
          return (
            <Button
              key={month}
              variant="outline"
              disabled={disabled}
              className={cn(
                "h-9 text-sm",
                selectedMonth === index && selectedYear === year && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => handleMonthClick(index)}
            >
              {month.slice(0, 3)}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
