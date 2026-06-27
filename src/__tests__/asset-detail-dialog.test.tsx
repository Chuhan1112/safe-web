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

  // 回归：CN ticker 的 TradingView URL 需去除 .SS/.SZ 后缀
  it("converts SS suffix to SHA: prefix for TradingView URL", () => {
    const html = renderToStaticMarkup(
      <AssetDetailDialog ticker="600519.SS" open onOpenChange={() => {}} market="CN" />,
    )

    expect(html).toContain("SHA:600519")
  })

  it("converts SZ suffix to SZSE: prefix for TradingView URL", () => {
    const html = renderToStaticMarkup(
      <AssetDetailDialog ticker="000001.SZ" open onOpenChange={() => {}} market="CN" />,
    )

    expect(html).toContain("SZSE:000001")
  })

  it("keeps US ticker unchanged for TradingView URL", () => {
    const html = renderToStaticMarkup(
      <AssetDetailDialog ticker="AAPL" open onOpenChange={() => {}} market="US" />,
    )

    expect(html).toContain("tradingview.com/symbols/AAPL/")
  })
})
