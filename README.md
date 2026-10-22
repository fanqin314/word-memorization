# 英语单词学习工作台

一套「单词卡 + 学习台」的本地优先英语学习系统。每张单词卡是一个独立的单文件 HTML，
主页 `index.html` 会自动扫描、汇总并渲染所有卡片，支持按词根筛选、每日推荐、滑动学习与手写画板。

**在线站点：** https://fanqin314.github.io/word-memorization/

---

## 特色

| 能力 | 说明 |
| --- | --- |
| 独立单词卡 | 每张卡自包含 CSS / SVG 动画 / JS，双击即可打开，不依赖网络 |
| 风格统一 | 新粗野主义 + 手账拼贴：3px 描边、硬边投影、轻微旋转、低饱和专属配色 |
| 意象卡动画 | 每张卡用一段原创 SVG 动画把词义"演"出来，作为记忆锚点 |
| 自动汇总 | 放入新卡 → 生成脚本解析元数据 / SVG / 动画 CSS → 主页自动收录 |
| 自动同步 | 常驻监听进程检测新卡，自动改名、生成数据、提交推送，GitHub Pages 自动部署 |
| 学习模式 | 全屏左右滑动切换单词，桌面端支持方向键 |
| 手写画板 | 滑动学习模式内可手写单词，按单词保存笔迹到 localStorage |
| 移动端适配 | 窄屏工具栏换行、首屏可见卡片、操作按钮放大、刘海屏安全区 |

---

## 目录结构

```
英语单词/
├─ index.html            # 单文件 SPA：主页 + 卡片列表 + 详情抽屉 + 滑动学习 + 画板
├─ <单词>.html           # 每张单词卡（如 form.html / improve.html）
├─ words-data.js         # 自动生成：卡片元数据 + 意象卡 SVG + 动画 CSS + 学习中泛光变量
├─ 更新单词数据.ps1      # 扫描卡片并生成 words-data.js，可选同步到 GitHub
├─ 更新单词数据.bat      # 双击入口
├─ 自动同步单词.ps1      # 常驻监听进程：检测新卡并自动完成全流程
└─ 开启自动同步.bat      # 双击启动监听（含开机自启配置）
```

---

## 新增一张单词卡

1. 用下面的提示词让任意 AI 生成卡片（推荐把 `form.html` 一起发给它当范例）。
2. 把输出保存为 `单词.html` 放进本目录。
3. 结束 —— 常驻监听进程约 2 秒后自动完成改名、生成数据、提交、推送。

需要手动触发时，双击 `更新单词数据.bat` 即可。

---

## 让其他 AI 生成同风格卡片的提示词

> 最有效的做法是 **给一张现成卡片当范例 + 这份硬约束提示词**。
> 纯文字描述很难复刻风格，AI 很容易滑向"紫色渐变 + emoji 图标"。

把 `form.html`（或任意一张卡）的源码与下面的模板一起发给 AI，并将 `[单词]` 替换为目标词。

```text
你是一名英语单词卡片设计师。请为单词 [单词] 生成**一个完整的单文件 HTML**，
风格严格模仿我附上的参考卡片（新粗野主义 + 手账拼贴），并把词义转化成一张可视化意象图。

# 一、输出格式（必须严格遵守，会被自动解析程序读取）
1. 标题：<title>单词 · 中文释义</title>   （中间必须是间隔号 "·"）
2. hero 大字：<span class="word-anim" aria-label="单词">，内部每个字母一个 <span class="letter l1">…
3. <div class="spell-hint">单词 &nbsp; 释义</div>   （释义必须写在 &nbsp; 之后）
4. <div class="ipa-anim">英 /fɔːm/ &nbsp;·&nbsp; 美 /fɔːrm/</div>   （只识别其中第一个 /…/）
5. <div class="pos-anim">n. · v.</div>
6. <div class="root-line"> 用 <span class="affix"> 包前缀、<span class="stem"> 包词根，
   写成「词根（拉丁/希腊原义）→ 引申 → 中文释义」
7. <div class="ic-main"> 一句话核心画面，单词用 <span class="hl">单词</span> 强调
8. 意象卡容器必须写成 <div class="ic-svg">，且**第一个子元素就是**
   <svg viewBox="0 0 360 280">…</svg>
9. 以上所有 class 属性的值必须**完全等于**这些名字，不要附加任何其他 class。

# 二、视觉风格
- 3px 黑色描边 + 硬边偏移投影（7px 7px 0 var(--ink)）+ 轻微旋转（±1deg）+ 大圆角（20–28px）
- 低饱和配色：纸色底 + 近黑墨色 + 一个专属主题色（每张卡不同，饱和度 ≤45%），辅助色不超过 3 个
- 正文用衬线字体（Georgia / Songti SC），标签用无衬线字体，字重 800–900
- 禁止：扁平化、玻璃拟态、大面积渐变、用 emoji 当图标、外链字体/图片、any CDN

# 三、:root 变量（顺序不能改，解析程序依赖）
:root{
  --paper:#…; --paper-2:#…;
  --<主题色名>:#…;        /* 第一个出现的彩色变量会被当作强调色 */
  --<主题色名>-soft:#…;
  --ink:#…; --deep:#…;    /* 墨色要在彩色变量之后 */
  …辅助色
  --shadow-hard:7px 7px 0 var(--ink);
  --shadow-hard-sm:4px 4px 0 var(--ink);
  --radius-lg:28px; --radius-md:20px;
}
注意：彩色主题变量必须排在 --ink 之前；变量名不要含 paper/soft/ink/shadow/radius/void/hl。

# 四、hero 区（会被首页"学习中"卡面复用）
- .hero 的第一条规则必须用 background:（不能用 background-image），写自上而下的
  linear-gradient，颜色偏浅（深色会自动被替换成纸色）
- .hero-band 的第一条规则也必须用 background:，用 repeating-linear-gradient 做条纹带

# 五、9 个 section（顺序与编号固定）
1 词根·词族：.root-line + 8 张同根词卡（.fam-card：.pos / .w / .p 音标 / .m 释义）
2 意象卡：.image-card，左文右图（.ic-svg）
3 核心搭配：5 条 .collo（.pattern 英文语块 + .meaning 中文）
4 真题例句：4 条 .real-ex（.src 来源 + .en 英文 + .cn 中文）
5 易错提醒：3 条 .pitfall-item，用 .wrong / .right / .tip
6 易混辨析：.compare-table 6 行，第一列为被辨析词，.chant 写"一句话口诀"
7 首字母填空：5 题，格式
  <span class="first-letter">f</span><span class="blank" onclick="this.classList.toggle('revealed')">orm</span>
8 造句练习：.write-practice + textarea，保存到 localStorage
9 复习打卡：4 个 .review-day（D1/D3/D7/D15），点击切换 done 并存 localStorage

# 六、意象卡 SVG 与动画（最关键）
- 必须把词义变成**一个具体的可视图景**：主体 + 动作 + 结果，而不是图标堆砌
- 每个动画类名用本卡专属前缀（例如 fm-frame / fm-press / fm-shape），前缀不能与其他卡重复
- 动画类必须真正出现在 SVG 元素上，并在 CSS 中用同一个类名写规则
  （解析程序只收录"SVG 里出现过的类"对应的 CSS；keyframes 也必须被这些规则引用）
- 推荐动画：描边逐段绘制（stroke-dasharray/offset）、周期下压或落位（带回弹
  cubic-bezier(.34,1.56,.64,1)）、颗粒飘落、标注虚线流动、高光闪烁
- 时长 3–5s、infinite，用 animation-delay 制造错峰；SVG 内颜色用 var(--…) 引用 :root

# 七、技术
- 单文件、<style> 内联、无任何外部依赖，双击即可打开
- 响应式两档：@media (max-width:640px) 与 @media (min-width:1100px)，另加 @media print
- 含滚动进度条 .progress-bar、IntersectionObserver 入场动画 .reveal
- 朗读用 speechSynthesis，lang='en-US'；中文注释；控制台不得报错

# 八、输出前自检
[ ] <title> 用 · 分隔单词与释义
[ ] spell-hint 里有 &nbsp;，释义在其后
[ ] ipa-anim 里第一个 /…/ 是音标
[ ] ic-svg 的第一个子元素是 <svg>
[ ] SVG 里每个动画类都有对应 CSS 规则，keyframes 均被引用
[ ] .hero 与 .hero-band 用 background:（不是 background-image）
[ ] 主题色变量写在 --ink 之前
[ ] 9 个 section 齐全、编号 1–9
[ ] 无外部依赖

只输出完整 HTML 代码，不要任何解释。
```

如果 AI 输出被截断（卡片较长），让它先输出第 1–5 段，回复"继续"后再输出第 6–9 段，最后拼接即可。

---

## 解析器硬约束（自建卡片时必看）

`更新单词数据.ps1` 用正则从卡片中提取信息，以下规则不满足会导致数据缺失：

| 字段 | 提取方式 | 不满足的后果 |
| --- | --- | --- |
| 单词 | `<title>单词 · 释义</title>`，兜底 `class="word-anim"` 的 `aria-label` | 卡片被跳过 |
| 释义 | `class="spell-hint"` 中 `&nbsp;` 之后的文本 | 释义为空，回落到 title |
| 音标 | `class="ipa-anim"` 中第一个 `/…/` | 音标为空 |
| 词性 | `class="pos-anim"` | 词性为空 |
| 词根拆解 | `class="root-line"` 的纯文本 | 无法归入词根筛选 |
| 意象描述 | `class="ic-main"` 的纯文本 | 详情抽屉无一句话描述 |
| 意象卡 SVG | `class="ic-svg"` 内**第一个** `<svg>` | 首页缩略图空白 |
| 动画 CSS | 只收录「SVG 中实际出现过的 class」对应的规则及其引用的 keyframes | 动画全部丢失 |
| 学习中卡面 | `.hero` / `.hero-band` 第一条带 `background:` 的规则 | 学习模式卡面无专属配色 |
| 强调色 | `:root` 中第一个名字不含 paper/soft/ink/shadow/radius/void/hl 的彩色变量 | 强调色退化为墨色 |

注意：这些关键 class 的属性值必须**完全等于**类名（如 `class="ic-svg"`），
写成 `class="ic-svg extra"` 会匹配失败。

---

## 常见问题

**Q：新卡放进目录后主页没变化？**
确认常驻监听进程在运行（`开启自动同步.bat`），或手动双击 `更新单词数据.bat`。刷新页面即可。

**Q：首页缩略图是空白？**
`ic-svg` 里的 `<svg>` 不是第一个子元素，或被包了一层 `<div>`。

**Q：卡片在主页里没有动画？**
动画 CSS 的选择器没有引用 SVG 内实际存在的类名，被解析器过滤掉了。

**Q：PowerShell 脚本中文乱码？**
`.ps1` 文件必须保存为 **UTF-8 with BOM**，否则 PowerShell 5 会按本地编码读取。

**Q：推送 GitHub 返回 502？**
重试即可，必要时用 `git -c http.version=HTTP/1.1 push origin main`；远端有新提交时先 `git pull --rebase` 再推送。

---

## 部署

GitHub Pages 通过 GitHub Actions 自动部署，部署前会先执行数据生成脚本，
因此无需手动提交 `words-data.js`。推送到 `main` 后约 1 分钟线上生效。
