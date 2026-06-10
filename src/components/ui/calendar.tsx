import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/style.css"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-4 relative", className)}
            classNames={{
                months: "rdp-months flex flex-col sm:flex-row space-y-4 sm:space-x-6 sm:space-y-0",
                month: "rdp-month space-y-3",
                month_caption: "rdp-month_caption mb-3 flex justify-center pt-1 relative items-center",
                caption_label: "rdp-caption_label text-sm font-semibold tracking-tight text-foreground",
                dropdowns: "rdp-dropdowns flex justify-center gap-2",
                dropdown: "rdp-dropdown cursor-pointer focus:outline-none text-sm font-medium text-foreground",
                dropdown_root: "rdp-dropdown_root inline-flex items-center rounded-md border border-border bg-transparent px-2.5 py-1 text-sm shadow-sm transition-colors hover:bg-secondary hover:text-foreground",
                months_dropdown: "rdp-months_dropdown",
                years_dropdown: "rdp-years_dropdown",
                nav: "rdp-nav flex items-center gap-1.5",
                button_previous: cn(
                    "rdp-button_previous absolute left-3 top-4 rounded-md border border-border/40 bg-transparent text-muted-foreground transition-all hover:bg-secondary hover:text-foreground",
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 p-0 opacity-70 hover:opacity-100 z-10 flex items-center justify-center"
                ),
                button_next: cn(
                    "rdp-button_next absolute right-3 top-4 rounded-md border border-border/40 bg-transparent text-muted-foreground transition-all hover:bg-secondary hover:text-foreground",
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 p-0 opacity-70 hover:opacity-100 z-10 flex items-center justify-center"
                ),
                month_grid: "rdp-month_grid w-full border-collapse",
                weekdays: "rdp-weekdays",
                weekday: "rdp-weekday pb-2.5 pt-1 text-[11px] font-medium text-muted-foreground/70 uppercase",
                weeks: "rdp-weeks",
                week: "rdp-week",
                day: "rdp-day text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                day_button: cn(
                    "rdp-day_button",
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 rounded-md border border-transparent p-0 text-sm font-normal text-foreground/80 transition-all duration-200 hover:bg-secondary hover:text-foreground aria-selected:opacity-100"
                ),
                selected:
                    "rdp-selected [&>.rdp-day_button]:bg-primary [&>.rdp-day_button]:text-primary-foreground [&>.rdp-day_button]:shadow-sm [&>.rdp-day_button]:font-medium [&>.rdp-day_button]:border-transparent",
                today: "rdp-today text-foreground [&>.rdp-day_button]:bg-secondary/60 [&>.rdp-day_button]:text-foreground [&>.rdp-day_button]:font-medium",
                outside:
                    "rdp-outside text-muted-foreground/40 [&>.rdp-day_button]:text-muted-foreground/40",
                disabled: "rdp-disabled text-muted-foreground/30 [&>.rdp-day_button]:text-muted-foreground/30",
                range_middle:
                    "rdp-range_middle text-foreground [&>.rdp-day_button]:rounded-none [&>.rdp-day_button]:border-transparent [&>.rdp-day_button]:bg-transparent [&>.rdp-day_button]:shadow-none [&>.rdp-day_button]:text-foreground",
                range_end: "rdp-range_end [&>.rdp-day_button]:bg-primary [&>.rdp-day_button]:text-primary-foreground",
                range_start: "rdp-range_start [&>.rdp-day_button]:bg-primary [&>.rdp-day_button]:text-primary-foreground",
                hidden: "rdp-hidden invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation, ...rest }) => {
                    if (orientation === "left") {
                        return <ChevronLeft className="h-4 w-4" {...rest} />
                    }
                    return <ChevronRight className="h-4 w-4" {...rest} />
                },
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
