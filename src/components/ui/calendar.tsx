import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DayButtonProps } from "react-day-picker"
import { motion, useReducedMotion, type Transition } from "motion/react"
import "react-day-picker/style.css"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export interface CalendarPreset {
    label: string
    getRange: (today: Date) => { from: Date; to: Date }
}

/** 位移走弹簧；颜色（opacity）单独走慢半拍的 tween */
const SPRING: Transition = { type: "spring", stiffness: 500, damping: 35, mass: 1 }
const COLOR_FADE: Transition = { delay: 0.08, duration: 0.25, ease: "easeOut" }

/**
 * range 模式的动画日格子：
 * - range_middle：整格铺 fill 片段（左右各溢出半格，与相邻格连成整条）
 * - range_start / range_end：半段 fill + 实心 knob + 弹簧描边圈
 * 位移走 spring，fill 颜色 opacity 慢 0.08s 跟随 —— preset 切换看起来像一个整体在移动。
 */
function AnimatedDayButton({ day, modifiers, className, ...rest }: DayButtonProps) {
    const reduced = useReducedMotion()
    const transition = reduced ? { duration: 0 } : SPRING

    const isStart = !!modifiers.range_start
    const isEnd = !!modifiers.range_end
    const isEdge = isStart || isEnd
    const isMiddle = !!modifiers.range_middle
    const isSingleDay = isStart && isEnd

    return (
        <span className="rdp-anim-cell absolute inset-0 flex items-center justify-center">
            {/* middle 整格 fill：铺满 td（td 无缝相邻，fill 天然连续）；outside 日略淡以示弱 */}
            {isMiddle && (
                <motion.span
                    aria-hidden
                    layout={reduced ? undefined : true}
                    transition={reduced ? { duration: 0 } : { ...SPRING, opacity: COLOR_FADE }}
                    initial={false}
                    animate={{ opacity: 1 }}
                    className={cn(
                        "absolute inset-0 bg-primary/15 dark:bg-primary/[0.07]",
                        day.outside && "opacity-60"
                    )}
                />
            )}
            {/* edge 整格 fill：色带穿过整个 edge 格，圆钮坐在色带上；四角圆化避免 knob 外露方角 */}
            {isEdge && !isSingleDay && (
                <motion.span
                    aria-hidden
                    layout={reduced ? undefined : true}
                    transition={
                        reduced ? { duration: 0 } : { ...SPRING, opacity: COLOR_FADE }
                    }
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                        "absolute inset-0 rounded-md bg-primary/15 dark:bg-primary/[0.07]",
                        day.outside && "opacity-60"
                    )}
                />
            )}
            <button
                type="button"
                className={cn(
                    "rdp-anim-day relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-transparent p-0 text-sm font-normal text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground",
                    isEdge &&
                        "bg-primary text-primary-foreground font-medium shadow-sm hover:bg-primary hover:text-primary-foreground",
                    // outside 但在 range 内（跨月选中日）：文字不随 outside 置灰——fill 已覆盖，置灰与 fill 矛盾
                    // （!important 压过 outside classNames 的后代选择器置灰规则）
                    day.outside && !isEdge && modifiers.selected
                        ? "!text-foreground/60"
                        : "",
                    className
                )}
                {...rest}
            />
            {/* knob 弹簧描边圈 */}
            {isEdge && (
                <motion.span
                    aria-hidden
                    layoutId={isStart ? "cal-knob-from" : "cal-knob-to"}
                    transition={transition}
                    className="pointer-events-none absolute inset-0 z-20 rounded-full border-2 border-primary"
                />
            )}
        </span>
    )
}

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    presets,
    ...props
}: CalendarProps & { presets?: CalendarPreset[] }) {
    const isRangeMode = props.mode === "range"
    const selected = (props as { selected?: unknown }).selected as
        | { from?: Date; to?: Date }
        | undefined
    // preset 点击后把显示月份带到新范围的末端，让弹簧动画可见
    const [displayMonth, setDisplayMonth] = React.useState<Date | undefined>(undefined)

    const presetRow =
        isRangeMode && presets?.length ? (
            <div
                data-cal-presets
                data-testid="cal-presets"
                className="mb-2 flex items-center gap-1.5 px-1"
            >
                {presets.map((p) => {
                    // Presets follow the current range start when it exists, so
                    // they stay meaningful for historical backtests and tests.
                    const r = p.getRange(selected?.from ?? new Date())
                    const active =
                        !!selected?.from &&
                        !!selected?.to &&
                        selected.from.toDateString() === r.from.toDateString() &&
                        selected.to.toDateString() === r.to.toDateString()
                    return (
                        <button
                            key={p.label}
                            type="button"
                            onClick={(e) => {
                                ;(
                                    props.onSelect as
                                        | ((
                                              range: { from: Date; to: Date },
                                              triggerDate: Date,
                                              modifiers: Record<string, boolean>,
                                              event: React.MouseEvent<HTMLButtonElement>
                                          ) => void)
                                        | undefined
                                )?.(r, r.to, { range_start: true, range_end: true }, e)
                                setDisplayMonth(r.to)
                            }}
                            className={cn(
                                "h-6 rounded-md px-2 text-xs font-medium transition-colors",
                                active
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                        >
                            {p.label}
                        </button>
                    )
                })}
            </div>
        ) : null

    return (
        <div className={cn("relative", className)}>
            {presetRow}
            <DayPicker
                showOutsideDays={showOutsideDays}
                month={displayMonth ?? (props as { defaultMonth?: Date }).defaultMonth}
                onMonthChange={(m) => {
                    setDisplayMonth(m)
                    ;(
                        (props as { onMonthChange?: (m: Date) => void }).onMonthChange as
                            | ((m: Date) => void)
                            | undefined
                    )?.(m)
                }}
                className={cn("p-4 relative", presetRow && "pt-1")}
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
                    weekday: "rdp-weekday pb-2.5 pt-1 text-xs font-medium text-muted-foreground/70 uppercase",
                    weeks: "rdp-weeks",
                    week: "rdp-week",
                    day: "rdp-day text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                    day_button: "",
                    selected:
                        "rdp-selected [&>.rdp-anim-cell>.rdp-anim-day]:aria-selected:opacity-100 [&>.rdp-anim-cell>.rdp-anim-day]:text-foreground",
                    today: "rdp-today text-foreground [&>.rdp-anim-cell>.rdp-anim-day]:font-medium",
                    // outside 但 selected（range 内跨月日）的文字由 AnimatedDayButton 处理——fill 已覆盖，置灰与 fill 矛盾
                    outside:
                        "rdp-outside [&>.rdp-anim-cell>.rdp-anim-day]:text-muted-foreground/40",
                    disabled:
                        "rdp-disabled [&>.rdp-anim-cell>.rdp-anim-day]:text-muted-foreground/30",
                    // range 着色全权交给动画层 fill，压掉 RDP/dark 主题的 td 背景避免双重叠加
                    ...(isRangeMode
                        ? {
                              range_middle:
                                  "rdp-range_middle !bg-transparent [&>.rdp-anim-cell>.rdp-anim-day]:rounded-none [&>.rdp-anim-cell>.rdp-anim-day]:border-transparent [&>.rdp-anim-cell>.rdp-anim-day]:shadow-none [&>.rdp-anim-cell>.rdp-anim-day]:text-foreground",
                              range_start: "rdp-range_start !bg-transparent",
                              range_end: "rdp-range_end !bg-transparent",
                          }
                        : {
                              range_middle: "rdp-range_middle",
                              range_start: "rdp-range_start",
                              range_end: "rdp-range_end",
                          }),
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
                    ...(props.components ?? {}),
                    ...(isRangeMode ? { DayButton: AnimatedDayButton } : {}),
                }}
                {...props}
            />
        </div>
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
