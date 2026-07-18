import { useMarket } from '@/contexts/MarketContext'

/**
 * 市场感知涨跌色：US 绿涨红跌，CN 红涨绿跌。
 * - upClass/downClass：Tailwind class，用于文本/背景
 * - upVar/downVar：CSS 变量名，用于 lightweight-charts 等需要 resolveChartColor 解析的场景
 */
export function useMarketColors() {
  const { market } = useMarket()
  const isCN = market === 'CN'
  return {
    isCN,
    upClass: isCN ? 'text-data-down' : 'text-data-up',
    downClass: isCN ? 'text-data-up' : 'text-data-down',
    upVar: isCN ? '--data-down' : '--data-up',
    downVar: isCN ? '--data-up' : '--data-down',
  }
}
