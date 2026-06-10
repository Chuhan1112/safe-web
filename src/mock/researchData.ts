// src/mock/researchData.ts — Mock research reports for demo

import type { ResearchReport } from '@/types/research'

export const mockResearchReports: ResearchReport[] = [
  {
    id: 'aaoi-2026-06-09',
    symbol: 'AAOI',
    companyName: 'Applied Optoelectronics',
    market: 'US',
    date: '2026-06-09',
    depth: 'quick_map',

    taskMode: 'first_pass_research',
    primaryRoute: 'research-loop',
    timeBoundary: '1Q_2Q',

    coreJudgment: 'AAOI 是 AI 数据中心光模块赛道的高贝塔标的，一年涨了 950%，但至今未盈利。当前的故事是收入高增速能否转化为盈利——Q1 收入 +51% YoY 到 $151M，亏损在收窄但经营现金流仍在恶化（-$85M）。公司刚拿到 hyperscale 客户的首个 1.6T 光模块批量订单，正在扩产到 90 万平方英尺。强赛道 + 高成长 + 高估值 + 未盈利 = 极高波动的 story stock。适合作为 AI 基础设施敞口观察，但在盈利兑现前不适合做 durable thesis。',
    judgmentConfidence: 'medium',
    confidenceBasis: '赛道方向和客户验证证据较强，但盈利路径和估值锚缺失降低了置信度',
    reversalCondition: '如果下两个季度毛利率无明显改善或 1.6T 订单无法转化为 repeat order，需降级 thesis',

    snapshot: [
      { label: '价格', value: '$177.45（6/9 盘中，-9.82%）' },
      { label: '市值', value: '~$14.4B' },
      { label: '52周区间', value: '$15.29 – $233.67' },
      { label: '收入 (TTM)', value: '$507M (+51% YoY)' },
      { label: '净利润 (TTM)', value: '-$43.34M（亏损收窄中）' },
      { label: '现金', value: '$439.7M（本季融资 +$389M）' },
      { label: '经营现金流', value: '-$85.35M（恶化中）' },
      { label: 'Forward P/E', value: '~31x' },
      { label: '做空比例', value: '12.38% of float' },
      { label: 'Beta', value: '3.60' },
      { label: 'RSI(14)', value: '50.33（中性）' },
      { label: '分析师目标价', value: '$172.75（共识 2.12，偏 Buy）' },
      { label: '1年涨幅', value: '+951%' },
    ],

    sources: [
      { name: 'Yahoo Finance', description: '实时行情 + TTM 财务数据', timestamp: 'Jun 9, 11:19 AM ET' },
      { name: 'Google Finance', description: 'Q1 FY2026 三表细节', timestamp: 'Jun 9, 2026' },
      { name: 'Finviz', description: '估值倍数、做空数据、分析师共识', timestamp: 'Jun 9, 2026' },
      { name: 'Seeking Alpha', description: '看多文章 "Why I\'m Buying The AAOI Dip"', timestamp: '3 hours ago' },
      { name: '24/7 Wall St.', description: 'AI 光学板块集体回调报道', timestamp: '1 week ago' },
    ],

    sourceGaps: [
      '缺乏 AAOI 自身 IR/财报电话会的一手信息（客户名称、1.6T 订单金额和交付时间表）',
      '无 peer comparison 量化数据（vs Coherent/Lumentum/旭创 的份额和毛利率对比）',
      '无分析师模型的详细盈利路径（$5.73 EPS 的假设基础不透明）',
    ],

    staleAfter: '2026-06-16',
    mustRefreshIf: 'AAOI 发布 Q2 财报 / 宣布重大客户订单 / 板块出现系统性重估 / 股价突破 $233 或跌破 $150',

    followUp: {
      question: '围绕 AAOI 的光模块客户集中度，你更希望验证它的大客户（hyperscaler）订单是长期框架协议还是项目制一次性采购？',
      rung: 'Rung B',
      routeBinding: 'selected_framework (customer concentration / revenue quality)',
      objectAnchor: 'AAOI hyperscale customer 1.6T transceiver order',
      decisionImpact: 'evidence_path → readiness_level',
    },
  },
  {
    id: '600487-2026-06-09',
    symbol: '600487',
    companyName: '亨通光电',
    market: 'CN',
    date: '2026-06-09',
    depth: 'quick_map',

    taskMode: 'first_pass_research',
    primaryRoute: 'research-loop',
    timeBoundary: '1Q_2Q',

    coreJudgment: '亨通光电是 A 股 CPO/光通信板块的龙头，涨停收在 ¥105.02，创历史新高，市值 2355 亿。这轮上涨的核心叙事是 AI 数据中心光互联——和美股 AAOI/Coherent 同一个主题但在 A 股的映射。最近 6 个交易日 3 个涨停板，单日成交 174 亿，已经是典型的 momentum-driven 阶段。基本面不差但估值已极端：Q1 收入 178 亿（+34% YoY），净利润 11.1 亿（+98.5% YoY），但 PE 已到 79x，PB 7.2x。强产业逻辑 + 弱估值锚 + A 股题材特性 = 极高波动的 story stock。',
    judgmentConfidence: 'medium',
    confidenceBasis: '产业趋势证据较强（AI 光互联需求真实、公司地位明确），但 79x PE 的估值无法用基本面锚定，且 A 股题材股的回撤可以非常剧烈',
    reversalCondition: '如果 CPO 主题退潮（板块龙头集体回调 >15%）、或 Q2 业绩增速显著放缓、或大股东/北向资金开始持续减持，需降级为 watch_only',

    snapshot: [
      { label: '价格', value: '¥105.02（6/9 收盘，涨停，+10%）' },
      { label: '市值', value: '~2355 亿 CNY' },
      { label: '52周区间', value: '¥14.61 – ¥105.02' },
      { label: 'PE (TTM)', value: '79.10x' },
      { label: 'PB', value: '7.20x' },
      { label: '收入 Q1', value: '177.9 亿（+34% YoY）' },
      { label: '净利润 Q1', value: '11.1 亿（+98.5% YoY）' },
      { label: '全年 EPS (2025)', value: '¥1.09' },
      { label: 'ROE (2025)', value: '8.43%' },
      { label: '现金', value: '137.4 亿' },
      { label: '控股股东', value: '亨通集团 24.28% + 崔根良 3.90%' },
      { label: '北向资金', value: '2.37%（增持中）' },
    ],

    sources: [
      { name: 'Google Finance', description: '实时行情 + Q1 FY2026 三表', timestamp: 'Jun 9, 16:29 GMT+8' },
      { name: '新浪财经', description: '公司概况、前十大股东（截至2026-03-31）、历史 EPS/ROE、分红记录', timestamp: 'Jun 9, 2026' },
    ],

    sourceGaps: [
      '缺亨通光电自身 IR 披露/年报一手信息（CPO 产品具体进度、客户验证状态、产能规划）',
      '无 peer comparison（vs 中天科技/长飞光纤/中际旭创 的估值和份额对比）',
      '79x PE 的隐含增长预期未做反算',
    ],

    staleAfter: '2026-06-10',
    mustRefreshIf: '明日开盘走势（是否连板/开板/放量回落）/ CPO 板块整体方向 / 龙虎榜机构席位动向 / 公司发布异动公告或停牌核查',

    followUp: {
      question: '围绕亨通光电的 CPO 产品进展，你更希望验证它在 CPO 产业链中是不可替代的核心环节，还是更多是主题映射而不是实际业绩受益？',
      rung: 'Rung B',
      routeBinding: 'selected_framework (industry chain position / revenue quality)',
      objectAnchor: '亨通光电 CPO 产品 vs 中际旭创/天孚通信的光模块差异化定位',
      decisionImpact: 'evidence_path → readiness_level',
    },
  },
]

export function getReportById(id: string): ResearchReport | undefined {
  return mockResearchReports.find(r => r.id === id)
}

export function getReportsBySymbol(symbol: string): ResearchReport[] {
  const upper = symbol.toUpperCase()
  return mockResearchReports.filter(r => r.symbol.toUpperCase() === upper)
}