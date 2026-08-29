// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { render, fireEvent, within } from "@testing-library/react"
import { Calendar, type CalendarPreset } from "@/components/ui/calendar"
import { addDays, format } from "date-fns"

const today = new Date(2026, 7, 29)

const presets: CalendarPreset[] = [
  { label: "1M", getRange: (t) => ({ from: t, to: addDays(t, 30) }) },
  { label: "3M", getRange: (t) => ({ from: t, to: addDays(t, 90) }) },
]

describe("Calendar presets", () => {
  it("传入 presets 时渲染 chips", () => {
    const { container } = render(
      <Calendar
        mode="range"
        selected={{ from: today, to: addDays(today, 30) }}
        presets={presets}
      />
    )
    const row = container.querySelector('[data-testid="cal-presets"]')!
    expect(within(row as HTMLElement).getByRole("button", { name: "1M" })).toBeTruthy()
    expect(within(row as HTMLElement).getByRole("button", { name: "3M" })).toBeTruthy()
  })

  it("点击 preset 触发 onSelect 且范围正确", () => {
    const onSelect = vi.fn()
    const { container } = render(
      <Calendar
        mode="range"
        selected={{ from: today, to: addDays(today, 30) }}
        onSelect={onSelect}
        presets={presets}
      />
    )
    const row = container.querySelector('[data-testid="cal-presets"]')!
    fireEvent.click(within(row as HTMLElement).getByRole("button", { name: "3M" }))
    expect(onSelect).toHaveBeenCalledTimes(1)
    const [range] = onSelect.mock.calls[0]
    expect(format(range.from, "yyyy-MM-dd")).toBe("2026-08-29")
    expect(format(range.to, "yyyy-MM-dd")).toBe("2026-11-27")
  })

  it("未传 presets 时不渲染 chips 行", () => {
    const { container } = render(
      <Calendar mode="range" selected={{ from: today, to: today }} />
    )
    expect(container.querySelector("[data-cal-presets]")).toBeNull()
  })
})
