# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目说明

**web-safe** 是一个公司安全的前端工作空间，用于 UI 开发、组件实验和布局探索。此仓库只包含 UI 原语、布局、交互实验和 Mock 数据，**不包含**私有接口、业务逻辑、算法公式或研究记录。

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

Node 版本要求：≥20 <25，推荐使用 Node 22（见 `.nvmrc`）。

## 架构概览

### 技术栈

- **React 19 + TypeScript**（严格模式）
- **Vite 7** 构建工具，支持 HMR
- **Tailwind CSS 4**（Vite 插件集成，无 `postcss.config.js` / `tailwind.config.js`）配合 CSS 变量实现主题切换
- **lightweight-charts** 图表库（K 线 + 面积图）
- **Vitest** 测试框架
- **shadcn/ui 风格**的 UI 原语（基于 CVA + Radix UI）

### 核心模块

| 路径 | 职责 |
|------|------|
| `src/App.tsx` | 顶层 Shell：主题切换、私有覆盖层加载、safe/private 视图切换 |
| `src/components/SafeWorkspace.tsx` | Safe 模式下的 Dashboard 主体（Tab 导航、卡片、表格） |
| `src/components/AssetChart.tsx` | K 线图，支持 SMA20/50/200、布林带叠加，响应式 + hover 信息栏 |
| `src/components/BacktestChart.tsx` | 多系列面积图，用于回测曲线对比，支持跨组件 hover 联动（`onHoverTime`） |
| `src/components/AnimatedNumber.tsx` | easeOutQuart 缓动数字动画 |
| `src/components/TickerLink.tsx` | 标的代码按钮，点击触发回调（不导航） |
| `src/components/skeletons/` | `ChartSkeleton`、`TableSkeleton` 加载占位 |
| `src/components/ui/` | 可复用 UI 原语（Button、Badge、Card、Table、Calendar、Dialog、Tabs 等） |
| `src/lib/privateOverlay.ts` | 私有覆盖层加载器：`import.meta.glob` 动态加载 `src/private/index.{ts,tsx}` |
| `src/mock/demoData.ts` | Mock 数据结构和类型定义 |
| `src/lib/utils.ts` | `cn()` 工具函数 |
| `src/hooks/useLocalStorage.ts` | 带 SSR 安全处理的 localStorage hook |
| `src/utils/requestCache.ts` | TTL 内存缓存单例 |
| `src/utils/deduplicateRequest.ts` | 并发请求合并（相同 key 的 in-flight 请求只发一次） |
| `src/utils/chartHoverLogic.ts` | 图表日期解析工具（`parseDateToTs`、`buildTradeMap`、`buildRebalanceMap`） |
| `src/globals.css` | 全局样式：`@theme` 颜色 token、CSS 变量主题、玻璃态效果、网格背景、噪点动画 |

### 私有覆盖层机制

`src/private/`（gitignored）可在本地放置私有逻辑，入口为 `src/private/index.{ts,tsx}`，需导出：
- `default`：React 组件（替换整个主视图）
- `overlayMeta`（可选）：`{ label, description, preferredView: 'safe' | 'private' }`

`VITE_ENABLE_PRIVATE_OVERLAY=0` 可完全禁用加载。

### UI 组件开发规范

- 组件使用 `React.forwardRef` + `...props` 展开 + `displayName`
- 变体（variants）通过 `class-variance-authority` (CVA) 管理
- 类名合并一律使用 `cn()`（来自 `src/lib/utils.ts`）
- 路径别名 `@/*` 指向 `./src/*`

### 主题系统

主题通过 CSS 变量实现，切换时在 `document.documentElement` 上添加/移除 `dark` 类。所有颜色 token（`--color-background`、`--color-foreground`、`--color-primary` 等）在 `globals.css` 的 `@theme` 块中定义（光亮模式默认值），`.dark` 选择器中覆盖暗色模式值。

### Mock 优先开发

项目无后端依赖。所有演示数据来自 `src/mock/demoData.ts`，新增界面应同样使用 Mock 数据，不引入真实接口。
