# 给设计方的回复：确认 + 全量 token（已对过代码）

> 用途：把本文件**整个**粘回设计会话。第一部分是拍板结论，第二部分是从仓库代码里逐字抄出来的 token 全表
> （`web/src/globals.css` 的 `:root` / `.dark` / `.perplexity` 三段 + `tailwind.config.js`），第三部分是代码级注意事项。
> 除标注外，所有值都是代码原文，不是推测。

---

## 第一部分：确认

第 1–4 条默认做法**全部确认，按你的方案做**，理由同意。补三处你在文档里看不到的代码事实，会影响你的取舍（详见第三部分）：

- 第 1 条（市场标识中性描边 + 小圆点）：确认。原因是代码里 `market-us` / `market-cn` 是**写死的 hex**，不随主题变，本来就是中性化更稳。
- 第 2 条（熔断不用红）：确认，用 `accent` + 图标 + 文字。**但注意 `accent` 在 perplexity 主题下是青色不是橙色**，见第三部分第 2 点。
- 第 3 条（BUY/SELL 不用涨跌色）：确认，这是修一个现存问题 —— 当前实现的 BUY/SELL/HOLD 是写死的 emerald/red/slate，采纳这条意味着要改一个组件，见第三部分第 1 点。
- 第 4 条（权重差额中性 + 正负号）：确认。

第 6 条（币种跟市场走：US `$` / CN `¥`）：确认。

第 5 条（缺的值）：本文件第二部分已全部补齐 —— perplexity 全套、`chart-1..6` 三主题全套、light 的 `muted-foreground` 与 `destructive`、间距刻度、以及你没问但会用到的玻璃态/动效工具类实际取值。

**交付方式确认**：1440px、dark 版、四态（有买卖 / 今日无调仓全 HOLD / 熔断中 / 空仓建仓 CTA）+ 一张信号解释抽屉。按这个出。

**唯一想请你先给个方案的**：见第三部分第 2 点的"告警语义 token"。你出图时先按“风险/告警 = 橙 + 图标 + 文字”画，我在代码侧补一个独立的 warn token 来接。

---

## 第二部分：token 全表（代码原文）

### 2.1 三主题色板（HSL 三元组，`hsl(var(--token))` 用法）

| token | light (`:root`) | dark (`.dark`) | perplexity |
|---|---|---|---|
| `background` | 0 0% 98% | 220 40% 8% | 20 0.3% 20% |
| `foreground` | 0 0% 20% | 210 24% 93% | 20 0.2% 87% |
| `card` | 0 0% 100% | 220 39% 11% | 20 0.2% 23% |
| `card-foreground` | 0 0% 20% | 210 24% 93% | 20 0.2% 87% |
| `popover` | 0 0% 100% | 220 39% 11% | 20 0.2% 23% |
| `popover-foreground` | 0 0% 20% | 210 24% 93% | 20 0.2% 87% |
| `primary` | 207 100% 45.1%（蓝） | 184 83% 53%（青） | 20 0.2% 87%（近白） |
| `primary-foreground` | 0 0% 100% | 220 46% 13% | 20 0.3% 20% |
| `secondary` | 204 31% 92% | 217 29% 18% | 20 0.2% 26% |
| `secondary-foreground` | 220 42% 14% | 210 24% 93% | 20 0.2% 87% |
| `muted` | 0 0% 94% | 217 29% 18% | 20 0.2% 23% |
| `muted-foreground` | 0 0% 46.7% | 214 16% 66% | 20 1.5% 60% |
| `accent` | 24 96% 53%（橙） | 24 94% 58%（橙） | 184 83% 53%（**青，不是橙**） |
| `accent-foreground` | 220 42% 14% | 210 40% 98% | 20 0.3% 20% |
| `destructive` | 0 80% 56% | 0 70% 45% | 0 84% 65% |
| `destructive-foreground` | 210 40% 98% | 210 40% 98% | 20 0.3% 20% |
| `border` | 0 0% 89.8% | 216 24% 24% | 20 0.2% 26% |
| `input` | 0 0% 89.8% | 216 24% 24% | 20 0.2% 26% |
| `ring` | 207 100% 45.1% | 184 83% 53% | 184 83% 53% |

### 2.2 数据与图表色

| token | light | dark | perplexity |
|---|---|---|---|
| `data-up` | 135 78% 38.6% | 142 76% 46% | 142 76% 46% |
| `data-down` | 0 84% 60% | 0 84% 65% | 0 84% 65% |
| `market-cn` | 0 84% 55% | 0 84% 60% | 0 84% 60% |
| `chart-1` | 217 91% 60% | 217 91% 65% | 217 91% 65% |
| `chart-2` | 160 84% 39% | 160 84% 48% | 160 84% 48% |
| `chart-3` | 35 92% 50% | 35 92% 55% | 35 92% 55% |
| `chart-4` | 0 84% 60% | 0 84% 65% | 0 84% 65% |
| `chart-5` | 270 70% 60% | 270 70% 65% | 270 70% 65% |
| `chart-6` | 186 92% 36% | 186 92% 48% | 186 92% 48% |

市场标识色（**注意：写死 hex，无主题变体**）：`market-us` = `#1d4ed8`，`market-cn` = `#dc2626`。

### 2.3 形状 / 字体 / 断点

- `--radius`: `0.625rem`（lg = 10px；md = radius - 2px = 8px；sm = radius - 4px = 6px）。三主题共用，perplexity 不覆盖。
- 界面字体：`Inter, system-ui, sans-serif`；等宽：`JetBrains Mono, ui-monospace, monospace`。仅这两族，从 Google Fonts 引入。
- 标题（h1–h6）`letter-spacing: -0.02em`，Inter。
- 小号档 `text-2xs` = `0.625rem` / 行高 `0.875rem` / `letter-spacing: 0.01em`（即 10px）。
- 主工作区最大宽度 `max-width: page` = **1680px**。
- 间距：**Tailwind 默认刻度，无任何覆盖**（基准 0.25rem = 4px，即 1/2/3/4/6/8/12/16… 倍）。没有自定义 spacing token。
- 断点：Tailwind 默认（sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536）。注意 2xl(1536) < 页面最大宽(1680)。左侧图标栏是 `hidden md:flex` —— 768px 以下换成底部导航；1440px 视口下走桌面侧栏。
- 阴影：**没有 shadow token 体系**，代码里用的是临时 `0 1px 3px rgba(0, 0, 0, 0.1)`。请沿用这个值，不要引入新的阴影语言。

### 2.4 动效词汇（与 `src/lib/motion.ts`、tailwind 保持同步）

时长：`--dur-press` 90ms · `--dur-snap` 140ms · `--dur-move` 220ms · `--dur-enter` 280ms
缓动：`--ease-snap` cubic-bezier(0.2, 0.8, 0.2, 1) · `--ease-spring` cubic-bezier(0.34, 1.32, 0.44, 1) · `--ease-liquid` cubic-bezier(0.32, 1.5, 0.5, 1) · `--ease-enter` cubic-bezier(0.22, 1, 0.36, 1)

对应命名动画：`motion-in`(enter/ease-enter) · `motion-out`(snap) · `motion-fade-in/-out` · `motion-sheet-in`(move/ease-spring) · `motion-sheet-out`(snap) · `animate-fade-up`(enter/ease-enter，translateY(10px)→0) · `stagger-1..5` = 0/50/100/150/200ms 延迟。

### 2.5 可复用的质感工具类（请照着还原，别自创）

- `.liquid-glass-container` — 玻璃态容器：`inline-flex`，背景 `hsl(var(--card))`，1px `hsl(var(--border))`，阴影 `0 1px 3px rgba(0,0,0,.1)`，圆角 12px，内边距 4px。
- `.glass-pill-v7` — 滑块药丸：背景 `hsl(var(--primary))`，圆角 8px，`transition: all .2s ease-out`，同上阴影。
- `.liquid-refraction-overlay` — 鼠标跟随折射高光：`radial-gradient(circle at var(--mouse-x) var(--mouse-y), hsl(var(--primary) / 0.05), transparent 80%)`，只 5% 不透明度。
- `.motion-interactive` — **所有可点击元素的规范过渡**：颜色/背景/边框/阴影/透明度走 snap 140ms + ease-snap，transform 走 move 220ms + ease-spring；`:active` 时 `scale(0.97)` 且 transform 换成 press 90ms。不要再叠加 `transition-*` / `duration-*` / `active:scale-*`。
- `.custom-scrollbar` — 6px 细滚动条，拇指 `muted-foreground/30`，hover `/50`，轨道透明。
- 主题切换是**一次协调的淡变**：`background-color, border-color, color, fill, stroke` 180ms + ease-snap，且尊重 `prefers-reduced-motion`。
- 减动效：`prefers-reduced-motion: reduce` 下所有动效降到 1ms / 关闭。

---

## 第三部分：三处会让这版设计"落地时翻车"的代码事实

### 1. 现状的 BUY/SELL 是写死的，且不跟随主题与市场

当前实现（`src/components/ActionFilter.tsx`）硬编码 Tailwind 调色板：

- BUY → `border-emerald-500/30 bg-emerald-500/15 text-emerald-500`
- SELL → `border-red-500/30 bg-red-500/15 text-red-500`
- HOLD → `border-border/50 bg-muted/50 text-foreground/70`

未选中态是 `border-border/30 text-muted-foreground/40`。

两个后果：
(a) 它不跟随三主题，也不跟随 US/CN 市场；
(b) 它是全仓唯一绕过 token 的地方 —— 你第 3 条的设计正好把这个问题修掉。

所以请把这版动作标签定义成**纯 token 驱动**的样式，我按你的定义改组件。

### 2. `accent` 在 perplexity 主题下是青色 —— 不能用它承载"告警"语义

`accent`：light 橙(24 96% 53%)、dark 橙(24 94% 58%)、**perplexity 青(184 83% 53%)**（和该主题的 `ring` 同值）。

而 `destructive` 三主题都偏红／珊瑚：light 0 80% 56%、dark 0 70% 45%、perplexity 0 84% 65%。

所以"熔断中"如果绑到 `accent`，在 perplexity 下会变成青色的"警示"，语义就丢了。建议：**你把风险/告警画成"橙 + 图标 + 文字"**（暗色下就是当前 dark 的 accent），我在代码侧新增一个独立的 `warn` token，三主题都给橙，专门承载"熔断中 / 暂停开仓 / 数据陈旧"。`destructive` 仍然只留给真正的错误与失败。

### 3. 数字排版：确认按等宽右对齐，两处细节

- 表格数字列：`JetBrains Mono` + 右对齐 + `tabular-nums`（避免逐行抖动）。代码已有 `font-mono` 工具类指向 JetBrains Mono。
- 权重 1 位小数、收益率 2 位小数、显式正负号 —— 按文档执行。注意这是**全局规则**，请把它写进你的输出规范，而不只是信号页。
