"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { DayPicker, DateRange } from "react-day-picker"
import { id } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverPortal, PopoverPositioner, PopoverTrigger } from "@/components/ui/popover"

export type DateRangePickerProps = {
  dateRange?: DateRange
  onDateRangeChange?: (dateRange: DateRange | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

function DateRangePicker({
  dateRange,
  onDateRangeChange,
  placeholder = "Pilih rentang tanggal...",
  disabled = false,
  className,
}: DateRangePickerProps) {
  const handleSelect = React.useCallback((selectedRange: DateRange | undefined) => {
    onDateRangeChange?.(selectedRange)
  }, [onDateRangeChange])

  const displayValue = React.useMemo(() => {
    if (!dateRange?.from) return placeholder
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "dd/MM/yyyy", { locale: id })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: id })}`
    }
    return format(dateRange.from, "dd/MM/yyyy", { locale: id })
  }, [dateRange, placeholder])

  return (
    <Popover>
      <PopoverTrigger>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateRange?.from && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverPositioner sideOffset={4}>
          <PopoverContent className="w-auto p-0">
            <DayPicker
              mode="range"
              selected={dateRange}
              onSelect={handleSelect}
              locale={id}
              disabled={disabled}
              numberOfMonths={2}
              className="p-3"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                ),
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
            <div className="flex items-center justify-between border-t p-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onDateRangeChange?.(undefined)
                }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                disabled={!dateRange?.from || !dateRange?.to}
              >
                Done
              </Button>
            </div>
          </PopoverContent>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  )
}

export { DateRangePicker }