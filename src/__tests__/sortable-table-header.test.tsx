import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/components/ui/table", () => ({
  TableHead: ({ children, className, ...props }: any) => (
    <th className={className} {...props}>{children}</th>
  ),
}))

import { SortableTableHeader } from "@/components/SortableTableHeader"

describe("SortableTableHeader", () => {
  const defaultProps = {
    label: "Price",
    sortKey: "price",
    currentSort: { key: "", direction: null as null },
    onSort: vi.fn(),
  }

  it("renders the label", () => {
    const html = renderToStaticMarkup(<SortableTableHeader {...defaultProps} />)
    expect(html).toContain("Price")
  })

  it("shows default icon when not sorted", () => {
    const html = renderToStaticMarkup(<SortableTableHeader {...defaultProps} />)
    expect(html).toContain("opacity-30")
  })

  it("shows ascending arrow when sorted asc", () => {
    const html = renderToStaticMarkup(
      <SortableTableHeader
        {...defaultProps}
        currentSort={{ key: "price", direction: "asc" }}
      />,
    )
    expect(html).toContain("lucide-arrow-up")
  })

  it("shows descending arrow when sorted desc", () => {
    const html = renderToStaticMarkup(
      <SortableTableHeader
        {...defaultProps}
        currentSort={{ key: "price", direction: "desc" }}
      />,
    )
    expect(html).toContain("lucide-arrow-down")
  })

  it("aligns right when specified", () => {
    const html = renderToStaticMarkup(
      <SortableTableHeader {...defaultProps} align="right" />,
    )
    expect(html).toContain("text-right")
  })
})
