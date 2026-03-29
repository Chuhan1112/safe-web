import * as React from "react"
import { DayPicker } from "react-day-picker"

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
            className={cn("p-4", className)}
            classNames={{
                months: "rdp-months flex flex-col sm:flex-row space-y-4 sm:space-x-6 sm:space-y-0",
                month: "rdp-month space-y-3",
                month_caption: "rdp-month_caption mb-3 flex justify-center pt-1 relative items-center",
                caption_label: "rdp-caption_label text-sm font-semibold tracking-tight text-foreground",
                dropdowns: "rdp-dropdowns flex justify-center gap-2",
                dropdown: "rdp-dropdown cursor-pointer focus:outline-none text-sm font-medium text-foreground",
                dropdown_root: "rdp-dropdown_root inline-flex items-center rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1 text-sm shadow-sm transition-colors hover:border-primary/30 hover:bg-secondary/60",
                months_dropdown: "rdp-months_dropdown",
                years_dropdown: "rdp-years_dropdown",
                nav: "rdp-nav flex items-center gap-1.5",
                button_previous: cn(
                    "rdp-button_previous absolute left-1 rounded-lg border border-border/60 bg-secondary/40 text-muted-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary",
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 p-0 opacity-100"
                ),
                button_next: cn(
                    "rdp-button_next absolute right-1 rounded-lg border border-border/60 bg-secondary/40 text-muted-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary",
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 p-0 opacity-100"
                ),
                month_grid: "rdp-month_grid w-full border-collapse",
                weekdays: "rdp-weekdays",
                weekday: "rdp-weekday pb-2.5 pt-1 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground/55 uppercase",
                weeks: "rdp-weeks",
                week: "rdp-week",
                day: "rdp-day text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                day_button: cn(
                    "rdp-day_button",
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 rounded-lg border border-transparent p-0 text-sm font-medium text-foreground/80 transition-all duration-150 hover:border-primary/15 hover:bg-primary/8 hover:text-foreground aria-selected:opacity-100"
                ),
                selected:
                    "rdp-selected [&>.rdp-day_button]:border-primary/30 [&>.rdp-day_button]:bg-primary [&>.rdp-day_button]:text-primary-foreground [&>.rdp-day_button]:shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.5)] [&>.rdp-day_button]:font-semibold",
                today: "rdp-today text-foreground [&>.rdp-day_button]:border-primary/25 [&>.rdp-day_button]:bg-primary/10 [&>.rdp-day_button]:text-primary [&>.rdp-day_button]:font-bold",
                outside:
                    "rdp-outside text-muted-foreground/30 [&>.rdp-day_button]:text-muted-foreground/30",
                disabled: "rdp-disabled text-muted-foreground/25 [&>.rdp-day_button]:text-muted-foreground/25",
                range_middle:
                    "rdp-range_middle bg-primary/[0.08] text-foreground/85 [&>.rdp-day_button]:rounded-none [&>.rdp-day_button]:border-transparent [&>.rdp-day_button]:bg-transparent [&>.rdp-day_button]:shadow-none",
                range_end: "rdp-range_end bg-gradient-to-r from-primary/[0.08] from-50% to-transparent to-50%",
                range_start: "rdp-range_start bg-gradient-to-r from-transparent from-50% to-primary/[0.08] to-50%",
                hidden: "rdp-hidden invisible",
                ...classNames,
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
