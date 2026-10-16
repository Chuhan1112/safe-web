# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目说明

**web** 是一个公司安全的前端工作空间，用于 UI 开发、组件实验和布局探索。此仓库只包含 UI 原语、布局、交互实验和 Mock 数据，**不包含**私有接口、业务逻辑、算法公式或研究记录。

**安全规则**：如果某个界面、标签、数据 payload 或测试名称揭示了私有系统的工作方式，应保留在私有仓库中。私有内容放在 `src/private/`（已 gitignore），通过私有覆盖层机制注入。

## 常用命令

```bash
# 启动开发服务器（Vite，默认 http://localhost:5173）
npm run dev

# 构建生产版本（TypeScript 检查 + Vite 打包）
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint

# 运行测试（一次性）
npm run test

# 测试监听模式
npm run test:watch

# 运行单个测试文件
npm run test -- --reporter=verbose <test-file-path>

# 禁用私有覆盖层启动（仅展示 safe 内容）
VITE_ENABLE_PRIVATE_OVERLAY=0 npm run dev
```

每次批量改动后务必验证：`npm test && npm run lint && npm run build`

Node 版本要求：≥20 <25，推荐使用 Node 22（见 `.nvmrc`）。

## 不得随意修改的文件

以下文件未经视觉 review 不要修改：

- `src/globals.css` — 包含已确认的字体、颜色 token、玻璃态效果、背景光晕和间距氛围，大改会让 app 视觉风格面目全非
- `tailwind.config.js` / `postcss.config.js` / `vite.config.ts` — 绑定当前 Tailwind v3 工具链，升级 Tailwind 或改变插件配置曾导致 UI 风格变化并破坏本地开发
- `src/components/ui/calendar.tsx` — 对 `react-day-picker` 版本敏感，且承载 CSS 弹簧动画层（`animate-cal-fill` / `animate-cal-knob`，详见"Calendar 弹簧动画"小节的不变量）；改动组件 API 时必须同步对齐包版本，改样式前先读动画不变量

## UI 改动验证规范

UI 改动**必须用无头浏览器截图自查后才能声称完成**（本机有 Playwright Chromium 缓存 + Chrome，不要把"肉眼确认"推给用户）：

1. `npm run dev` 起服务，Playwright 连 Chrome（`executablePath` 指向 `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`）截图
2. **截图必须给完整视口/popover 边界**——裁剪边缘会被误读为渲染缺陷（曾发生：评审 agent 把截图裁剪边当成"色带断裂"）
3. 视觉 bug 用 DOM 实测定位（`getBoundingClientRect`、`getComputedStyle`、className 检查），不要猜；每层修复后重截图确认
4. Tailwind 类"静默不编译"两类坑：v4 语法后缀 `!`（v3 要前缀）、非标准透明度刻度 `/12`——排查手段是在浏览器里枚举 `document.styleSheets` 查规则是否存在

## 安全 vs 高风险改动

**通常安全：**
- shared hooks、请求缓存工具、图表 hover/日期解析工具
- 图表主题响应（仅更新 chart runtime options，不重写样式）
- 动画平滑度修复、骨架屏组件、纯展示组件（不改动视觉 token）
- bug 修复（不重写布局/样式系统）

**视为产品级改动，需谨慎：**
- Tailwind 大版本升级
- 主题 token 重写、全局 CSS 重构
- 替换 Radix/shadcn 风格原语
- Calendar 组件 API 变更
- 图表样式大幅重写

## 架构概览

### 技术栈

- **React 19 + TypeScript**（严格模式）
- **Vite 7** 构建工具，支持 HMR
- **Tailwind CSS 3**（保持 v3 + PostCSS 工具链）配合 CSS 变量实现主题切换
- **lightweight-charts** 图表库（K 线 + 面积图）
- **Vitest** 测试框架
- **shadcn/ui 风格**的 UI 原语（基于 CVA + Radix UI）

### 核心模块

| 路径 | 职责 |
|------|------|
| `src/App.tsx` | 顶层 Shell：主题切换（持久化到 localStorage）、私有覆盖层加载、safe/private 视图切换；两个视图**始终 mounted**，用 CSS hidden 切换，保证后台任务不中断 |
| `src/components/SafeWorkspace.tsx` | Safe 模式下的主体（Overview / Studio / Collection / Notes 四个 Tab），Tab 同样 CSS hidden 切换 |
| `src/components/AssetChart.tsx` | K 线图，支持 SMA20/50/200、布林带叠加、日涨跌幅，响应式 + hover 信息栏 |
| `src/components/BacktestChart.tsx` | 多系列面积图，用于回测曲线对比，支持跨组件 hover 联动（`onHoverTime`） |
| `src/components/ChartPanel.tsx` | 回测图表面板（equity/drawdown 切换、多策略对比、hover 持仓快照），从私有区提取的公共组件 |
| `src/components/AssetDetailDialog.tsx` | 标的详情弹窗，接受可选 `fetchData` prop 加载 K 线数据（无 prop 时不发请求，safe 模式下安全渲染） |
| `src/components/TradeLogsTable.tsx` | 交易日志表格，按日期分组展示 BUY/SELL/HOLD 记录 |
| `src/components/RebalanceLogsTable.tsx` | 再平衡日志表格，展示持仓变动、权重和价格 |
| `src/components/AnimatedNumber.tsx` | easeOutQuart 缓动数字动画 |
| `src/components/TickerLink.tsx` | 标的代码按钮，点击触发回调（不导航） |
| `src/components/skeletons/` | `ChartSkeleton`、`TableSkeleton` 加载占位 |
| `src/components/ui/` | 可复用 UI 原语（Button、Badge、Card、Table、Calendar、Dialog、Tabs 等） |
| `src/components/ui/calendar.tsx` | react-day-picker v9 封装 + CSS 弹簧动画层（range fill/knob，纯 CSS，无 motion 依赖）+ 可选 `presets` 快捷范围 chips，详见下方"Calendar 弹簧动画"小节 |
| `src/lib/privateOverlay.ts` | 私有覆盖层加载器：`import.meta.glob` 动态加载 `src/private/index.{ts,tsx}` |
| `src/mock/demoData.ts` | Mock 数据结构和类型定义 |
| `src/lib/utils.ts` | `cn()` 工具函数 |
| `src/hooks/useLocalStorage.ts` | 带 SSR 安全处理的 localStorage hook |
| `src/hooks/useIsDark.ts` | 响应式暗色主题 hook（MutationObserver），带 SSR guard |
| `src/utils/requestCache.ts` | TTL 内存缓存单例 |
| `src/utils/deduplicateRequest.ts` | 并发请求合并（相同 key 的 in-flight 请求只发一次） |
| `src/utils/chartHoverLogic.ts` | 图表日期解析工具（`parseDateToTs`、`buildTradeMap`、`buildRebalanceMap`） |
| `src/globals.css` | 全局样式：CSS 变量主题、玻璃态效果、网格背景、噪点动画、scrollbar 样式 |

### 私有覆盖层机制

`src/private/`（gitignored）可在本地放置私有逻辑，入口为 `src/private/index.{ts,tsx}`，需导出：
- `default`：React 组件（替换整个主视图）
- `overlayMeta`（可选）：`{ label, description, preferredView: 'safe' | 'private' }`

`VITE_ENABLE_PRIVATE_OVERLAY=0` 可完全禁用加载。

`src/private/` 适合放：真实业务编排、私有 API 客户端、业务专属页面和标签。
公共区（`src/components/`）适合放：通用 UI 原语、通用工具函数、可复用视觉组件。

**提取原则**：从私有区提取组件到公共区时，必须同时剥离所有 `@/private/*` 依赖——用本地接口替换私有类型，用注入 prop 替换私有 API 调用，确保 `src/private/` 不存在时 build 仍能通过。

### UI 组件开发规范

- 组件使用 `React.forwardRef` + `...props` 展开 + `displayName`
- 变体（variants）通过 `class-variance-authority` (CVA) 管理
- 类名合并一律使用 `cn()`（来自 `src/lib/utils.ts`）
- 路径别名 `@/*` 指向 `./src/*`

### 视图与 Tab 切换

Safe/Private 视图切换和 SafeWorkspace 内的 Tab 切换均使用 **CSS hidden** 方案（`className="hidden"`），而非条件渲染。两个视图始终 mounted，切换时不会 unmount 组件树，保证后台 polling、WebSocket、任务进度状态不中断。

### 主题系统

主题通过 CSS 变量实现，切换时在 `document.documentElement` 上添加/移除 `dark` 类，并持久化到 `localStorage`。颜色 token（`--background`、`--foreground`、`--primary` 等）定义在 `globals.css` 的 `:root` 和 `.dark` 选择器中。`App.tsx` 同时用 `MutationObserver` 监听 `<html>` class，Private overlay 自行切换主题时 App 层也能同步。

> **注意**：当前保持 Tailwind v3 变量命名（`--background` 等）。若升级 Tailwind v4 则命名会变为 `--color-background`，私有仓库组件必须同步，否则颜色失效。

### 设计 Token 与 Cheatsheet 纪律

浅色主题（`:root`）按 Apps Design UI Cheatsheet 重写（dark/perplexity 保持原值）：

| Token | 浅色值 | 说明 |
|---|---|---|
| `--foreground` | `0 0% 20%`（#333333） | 正文 |
| `--muted-foreground` | `0 0% 46.7%`（#777777） | 次要文字 |
| `--primary` / `--ring` | `207 100% 45.1%`（#0077E6） | 全局主色 |
| `--background` | `0 0% 98%`（#FAFAFA） | 页面底 |
| `--border` / `--input` | `0 0% 89.8%`（#E5E5E5） | 边框 |
| `--radius` | `0.625rem` | 按钮 10px 圆角，md/sm 由 calc 缩放 |
| `--data-up` | `135 78% 38.6%`（#15B042） | 与 Badge success 同源 |

- **字体**：Inter（400/500/600/**700**——`font-bold` 全仓 99 处，import 必须带 700 否则退化合成加粗）+ JetBrains Mono。
- **尺寸纪律**：Button 默认 32px（sm 28 / lg 36 / icon 32）、Badge 20px 高 6px 圆角、Switch 24×14px（thumb 10px 位移 10px）、表格行 40px、Input/Select 32px。
- **Badge success 变体**：浅色精确 `bg-[#CAFACE] text-[#15B042]`；dark 分支保留 emerald 体系。

### Calendar 弹簧动画（`ui/calendar.tsx`）

react-day-picker v9 封装，`mode="range"` 时注入 CSS 动画层（复刻 Jeet 的 Date Range Picker：fill 颜色慢半拍、knob 弹簧浮现；已从 motion 迁移到纯 CSS，见文末「性能预算」）。**消费契约**：现有 props 全部透传，私有区消费者零改动兼容。

**新增 API**：`presets?: CalendarPreset[]`（`{ label, getRange: (today) => { from, to } }`），渲染顶部快捷 chips；未传或非 range 模式不渲染。

**实现不变量（改样式前必读）**：

- **fill 铺满 td 而非按钮**：RDP 的 `<td>` 是 44px，按钮 36px 居中——fill 挂按钮上会出现 8px 竖缝。fill 必须挂在 `absolute inset-0`（铺满 td）的层上，td 无缝相邻保证 fill 连续。
- **edge 格 fill 是整格不是半格**：半段 fill 与相邻整格 fill 交界处密度断层 + knob 四角露方角。整格 fill + `rounded-md` 圆角，圆钮坐在色带上。
- **td 双重染色必须压掉**：globals.css `.dark .rdp-root` 的 `--rdp-range_middle-background-color`（0.20）会涂在 td 上，与动画层 fill 叠加成 0.35 饱和度过高。range 模式下 range_middle/start/end 的 classNames 必须 `!bg-transparent`（**Tailwind v3 important 是前缀 `!`，后缀 `bg-x!` 是 v4 语法、静默不编译**）。
- **fill 透明度刻度**：`bg-primary/15`（light）/ `dark:bg-primary/[0.07]`。注意 `/12` 这类非标准刻度 Tailwind v3 不生成 CSS（静默失效），只能用预设刻度或 arbitrary `[0.07]`。
- **range 内跨月 outside 日**：文字不能随 outside 置灰（`!text-foreground/60` 压过 outside 后代选择器），否则置灰字 + fill 覆盖语义矛盾。
- **preset 点击后跳月**：`displayMonth` state 带到新范围末端（`month` 受控），否则动画发生在视野外等于没做。
- **动画参数（纯 CSS 版）**：fill = `animate-cal-fill`（250ms enter 曲线，delay 80ms，"颜色慢半拍"）；knob = `animate-cal-knob`（220ms spring 曲线，scale 0.6→1）；`prefers-reduced-motion` 时组件不挂动画类。位移不做逐格 FLIP（曾用 motion layout 投影，实测单次交互 1040 次函数调用/62ms 主线程，已移除）。
- **非 range 模式不注入 DayButton**（`components` 仅 range 时加 `AnimatedDayButton`），缩小影响面。

**测试**：`src/__tests__/calendar-presets.test.tsx`（presets 渲染/回调/缺省不渲染）；动画与视觉不做单测（jsdom 无布局），靠无头浏览器截图验证。

### Mock 优先开发

项目无后端依赖。所有演示数据来自 `src/mock/demoData.ts`，新增界面应同样使用 Mock 数据，不引入真实接口。
