import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/components/ui/dialog", () => {
  const Wrapper = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  return {
    Dialog: Wrapper,
    DialogContent: Wrapper,
    DialogHeader: Wrapper,
    DialogTitle: Wrapper,
    DialogDescription: Wrapper,
  }
})

vi.mock("@/components/AssetChart", () => ({
  AssetChart: () => <div>mock-asset-chart</div>,
}))

import { AssetDetailDialog } from "@/components/AssetDetailDialog"

describe("AssetDetailDialog", () => {
  it("renders an explicit fallback when no data loader is provided", () => {
    const html = renderToStaticMarkup(
      <AssetDetailDialog ticker="AAPL" open onOpenChange={() => {}} />,
    )

    expect(html).toContain("Market data unavailable")
    expect(html).toContain("did not provide a ticker data loader")
  })
})
