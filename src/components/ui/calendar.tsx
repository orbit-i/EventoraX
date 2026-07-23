"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-white group/calendar p-4 [--cell-size:--spacing(9)] rounded-2xl border border-[#e9e4ff] shadow-lg shadow-[#7c3aed]/5 [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-4 flex-col md:flex-row relative",
          defaultClassNames.months
        ),
        month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none text-[#64748b] hover:text-[#7c3aed] hover:bg-[#f5f3ff] rounded-xl",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none text-[#64748b] hover:text-[#7c3aed] hover:bg-[#f5f3ff] rounded-xl",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-semibold justify-center h-(--cell-size) gap-1.5 text-[#0f172a]",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative has-focus:border-[#7c3aed] border border-[#e9e4ff] shadow-sm has-focus:ring-[#7c3aed]/30 has-focus:ring-2 rounded-xl overflow-hidden",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute bg-white inset-0 opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-semibold text-[#0f172a]",
          captionLayout === "label"
            ? "text-sm"
            : "rounded-xl pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-[#94a3b8] [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-[#94a3b8] rounded-xl flex-1 font-medium text-[0.8rem] select-none",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full mt-2", defaultClassNames.week),
        week_number_header: cn(
          "select-none w-(--cell-size) text-[#94a3b8]",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.8rem] select-none text-[#94a3b8]",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative w-full h-full p-0 text-center [&:last-child[data-selected=true]_button]:rounded-r-xl group/day aspect-square select-none",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-xl"
            : "[&:first-child[data-selected=true]_button]:rounded-l-xl",
          defaultClassNames.day
        ),
        range_start: cn(
          "rounded-l-xl bg-[#f5f3ff]",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none bg-[#f5f3ff]", defaultClassNames.range_middle),
        range_end: cn("rounded-r-xl bg-[#f5f3ff]", defaultClassNames.range_end),
        today: cn(
          "bg-[#f5f3ff] text-[#7c3aed] rounded-xl data-[selected=true]:rounded-none border-2 border-[#ddd6fe]",
          defaultClassNames.today
        ),
        outside: cn(
          "text-[#cbd5e1] aria-selected:text-[#cbd5e1]",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-[#cbd5e1] opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-[#7c3aed] data-[selected-single=true]:text-white data-[selected-single=true]:shadow-md data-[selected-single=true]:shadow-[#7c3aed]/25 data-[range-middle=true]:bg-[#f5f3ff] data-[range-middle=true]:text-[#7c3aed] data-[range-start=true]:bg-[#7c3aed] data-[range-start=true]:text-white data-[range-end=true]:bg-[#7c3aed] data-[range-end=true]:text-white group-data-[focused=true]/day:border-[#7c3aed] group-data-[focused=true]/day:ring-[#7c3aed]/30 hover:bg-[#f5f3ff] hover:text-[#7c3aed] flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-2 data-[range-end=true]:rounded-xl data-[range-end=true]:rounded-r-xl data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-xl data-[range-start=true]:rounded-l-xl [&>span]:text-xs [&>span]:opacity-70 rounded-xl",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }