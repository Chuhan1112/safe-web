补充决定（在之前那份"放开约束"的基础上追加）：

1. **主题只做两套：light / dark。**
   之前提到的 perplexity 已决定砍掉，不要再为它出图，token 表也不需要第三套。
   主题切换是 light ↔ dark 两态循环。

2. **不要引入这三种重质感：光晕背景、网格背景、backdrop-filter 毛玻璃。**
   方向是扁平的：半透明底 + 1px 边框 + 柔和投影，不做 blur。
   玻璃态如果要用，就用"半透明 + 边框 + 投影"，不要用 `backdrop-filter`。

3. 因此：**token 表只需 light / dark 两套**，每套仍然要给全套 ——
   表面层、文字层、primary / accent / **up / down / danger / warn / info**（各自独立色位）、以及 6 个图表序列色。

其余约束（那四条语义不变量、数字排版规则、交付方式）不变。
