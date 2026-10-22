# 英语单词学习工作台

一套「单词卡 + 学习台」的本地优先英语学习系统。每张单词卡是一个 HTML 文件，
主页 `index.html` 会自动扫描、汇总并渲染所有卡片，支持按词根筛选、每日推荐、滑动学习与手写画板。

**在线站点：** https://fanqin314.github.io/word-memorization/

---

## 特色

| 能力 | 说明 |
| --- | --- |
| 独立单词卡 | 每张卡自包含配色 / SVG 动画 / 文案，双击即可打开，不依赖网络 |
| 公共资产 | 版式与交互逻辑抽成 `card-base.css` / `card-base.js`，44 张卡共享 |
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
├─ _card-template.html   # ★ 新卡模板：复制它开始写，只填专属部分
├─ card-base.css         # 公共样式：版式、卡片外观、表格、打卡、填空、响应式、打印
├─ card-base.js          # 公共脚本：进度条、入场、填空、朗读、造句存储、打卡持久化
├─ <单词>.html           # 每张单词卡（约 25–35 KB，其中大部分是意象 SVG 与文案）
├─ words-data.js         # 自动生成：卡片元数据 + 意象卡 SVG + 动画 CSS + 学习中泛光变量
├─ 更新单词数据.ps1      # 扫描卡片并生成 words-data.js，可选同步到 GitHub
├─ 更新单词数据.bat      # 双击入口
├─ 自动同步单词.ps1      # 常驻监听进程：检测新卡并自动完成全流程
└─ 开启自动同步.bat      # 双击启动监听（含开机自启配置）
```

---

## 卡片的分工：什么可复用，什么必须自己写

同一套骨架被 44 张卡共用，**公共部分约占 70%**（抽离前每卡 43–56 KB，抽离后 25–35 KB，整体减少 41%）。

| 内容 | 位置 | 新卡要不要写 |
| --- | --- | --- |
| 页面容器、分区标题、各类卡片外观、表格、填空、打卡、响应式、打印 | `card-base.css` | 不用 |
| 进度条、分段入场、表格逐行、打卡逐个、填空交互、朗读、造句存储、打卡持久化 | `card-base.js` | 不用 |
| 配色变量（`:root`） | 卡片 | 要（约 10 个颜色） |
| hero 区（大字、音标、词性、释义、条纹带、专属底纹） | 卡片 | 要 |
| 意象卡 SVG 与其动画 `@keyframes` | 卡片 | 要（最核心） |
| 9 个 section 的文案 | 卡片 | 要 |

因此给 AI 的指令应该是：**以 `_card-template.html` 为底稿，只替换里面带 `[占位符]` 的内容和意象 SVG，不要重复输出公共样式与脚本。**

---

## 新增一张单词卡

1. 复制 `_card-template.html` 为 `单词.html`（或让 AI 基于它生成）。
2. 填好 `:root` 配色、hero、意象 SVG 与动画、9 段文案。
3. 保存到本目录 —— 常驻监听进程约 2 秒后自动完成改名、生成数据、提交、推送。

需要手动触发时，双击 `更新单词数据.bat`。

---

## 让其他 AI 生成同风格卡片的提示词

> 推荐做法：**把 `_card-template.html` 一起发给 AI**，再说下面这段。有了模板，AI 只需产出约 15 KB 的专属内容。

```text
你是英语单词卡片设计师。我附上了一份卡片模板 _card-template.html，以及两个公共文件
card-base.css / card-base.js 的说明。请为单词 [单词] 生成**一个完整的 HTML**，
结构完全沿用模板，只替换专属内容。

# 一、绝对不要做的事
- 不要重新输出模板里的公共样式（.page / .section-title / .collo / .real-ex / .pitfall /
  .compare-table / .fill-item / .write-practice / .review-day / .progress-bar /
  .reveal 等），也不要重写交互脚本，公共文件已经提供。
- 不要把 <link rel="stylesheet" href="card-base.css"> 和
  <script src="card-base.js"></script> 删掉或改成内联。
- 不要在 <style> 里重复定义模板已有的基础版式。

# 二、只改这些地方
1. <title>[单词] · [中文释义]</title>          ← 间隔号 "·" 不能改
2. <body data-word="[单词]">                   ← 公共脚本靠它取朗读词与存储键
3. :root 配色（10 个变量）：
   --paper / --paper-2 纸色，--ink 墨色，--deep 深色块，
   --cb-accent 主题色 + --cb-accent-soft 其浅底，
   --cb-2 / --cb-2-soft、--cb-3 / --cb-3-soft 两个辅助色，--cb-deep。
   规则：所有颜色低饱和（主题色饱和度 ≤45%），--cb-accent 必须写在 --ink 之前。
   每张卡换一组不同色系，但保持"纸色底 + 近黑墨色 + 三色点缀"的结构。
4. hero：大字 span（每个字母一个 .letter，类名 l1/l2/l3… 依次递增）、
   .ipa-anim 里第一个 /…/ 是音标、.pos-anim 词性、
   .spell-hint 里 &nbsp; 之后写释义、.hero 与 .hero-band 的 background 换成新配色。
5. 意象卡：<div class="ic-svg"> 的**第一个子元素**必须是 <svg viewBox="0 0 360 280">。
6. 9 个 section 的文案。

# 三、意象卡 SVG（最重要）
- 把词义变成**一个具体的可视图景**：主体 + 动作 + 结果，而不是图标堆砌或纯文字排版。
- 动画类名用该单词专属前缀（fm- / im- / pr- …），前缀不能与模板示例重复。
- 每个动画类必须真的出现在 SVG 元素上，并在 <style> 里用同一类名写规则；
  对应的 @keyframes 也必须被这些规则引用（否则首页不会收录动画）。
- 推荐手法：描边逐段绘制（stroke-dasharray/offset）、周期落位（带回弹
  cubic-bezier(.34,1.56,.64,1)）、颗粒飘落、标注虚线流动、高光闪烁。
- 时长 3–5s、infinite，用 animation-delay 错峰；SVG 内颜色一律用 var(--cb-…) 引用。

# 四、内容要求（数量不能少）
1 词根·词族：.root-line 写「词根（原义）→ 引申 → 释义」+ 8 张 .fam-card
2 意象卡：.ic-main 一句话核心画面（单词用 .hl 包住）+ .ic-sub 2~3 行拆解
3 核心搭配：5 条 .collo
4 真题例句：4 条 .real-ex（.src 标注年份与考试题型，.en 用 <em class="hl"> 标出目标词）
5 易错提醒：3 条 .pitfall-item（用 .wrong / .right / .tip）
6 易混辨析：6 行 .compare-table，第一行加 class="highlight"，.chant 写一句话口诀
7 首字母填空：5 题，格式
  <span class="first-letter">f</span><span class="blank" onclick="this.classList.toggle('revealed')">orm</span>
8 造句练习：.write-practice + textarea#mySentence
9 复习打卡：4 个 .review-day，data-day 必须是 d1 / d3 / d7 / d15

# 五、输出前自检
[ ] <title> 用 · 分隔单词与释义
[ ] body 上有 data-word
[ ] spell-hint 里有 &nbsp;，释义在其后
[ ] ipa-anim 里第一个 /…/ 是音标
[ ] ic-svg 的第一个子元素是 <svg>
[ ] SVG 里每个动画类都有对应 CSS 规则，keyframes 均被引用
[ ] 没有重复输出公共版式样式与脚本
[ ] hero / hero-band 用 background:（不是 background-image）
[ ] --cb-accent 写在 --ink 之前
[ ] 9 个 section 齐全、编号 1–9

只输出完整 HTML，不要任何解释。
```

如果 AI 输出被截断（卡片较长），让它先输出第 1–5 段，回复"继续"后再输出第 6–9 段，最后拼接。

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

脚本会跳过 `index.html` 与 `_` 开头的文件（如 `_card-template.html`），所以模板不会被当成单词卡收录。

---

## 常见问题

**Q：新卡放进目录后主页没变化？**
确认常驻监听进程在运行（`开启自动同步.bat`），或手动双击 `更新单词数据.bat`。刷新页面即可。

**Q：卡片样式错乱、投影消失？**
检查 `:root` 是否缺少 `--cb-accent` / `--cb-2` / `--cb-3` 及其 `-soft` 版本。
`card-base.css` 对这些变量带兜底值，但缺失时各卡会退化成同一套配色。

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
