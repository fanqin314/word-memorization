# 汉译英逐句页：视觉重排 + 分级正反馈 计划

## Summary
把汉译英逐句页从"标签堆叠"改成一张**写译稿**：顶部细刻度进度、当前句为视觉主体、词块变成可逐个点亮的"待用清单"、输入框像稿纸；同时把正反馈拆成三级——**点亮一个词块 → 写完整句 → 整段收尾**，让成功来得更频繁、更小步。

## Current State Analysis（基于实际代码）
- 页面结构：[exam.js](file:///d:/apt/英语单词/mobile/js/exam.js#L960-L1019) `renderExamTrans()` 输出 `ex-bar`（返回/标题/`x / y`）+ 已完成清单 + `第 x / y 句` + 中文 + 词块 + 参考按钮 + textarea + 词数 + `ex-foot` 双按钮。
- 现状问题：
  1. 视觉噪音大：`第 1 / 4 句` 12px 等宽字、中文 1rem、词块 10.9px 胶囊、参考按钮 10.6px、词数 9.9px 挤在一起，层级几乎一样高，没有主次；
  2. 已完成句子是整行灰色 12.5px 文本堆在顶部，句一长就占半屏，把当前句挤下去；
  3. 输入框是 1px 直角边框 + 纯白底，和周围发丝线、方角语言脱节，看起来像"随手放的控件"；
  4. 反馈只有"整句完成"一次（✓ + ok 铃），写一句长的要熬很久才有一点回应，正反馈颗粒度太大。
- 现有可复用资产：[exam.css](file:///d:/apt/英语单词/mobile/css/exam.css#L203-L264) 的 `.ex-tr-*` 全部规则；[deck.js](file:///d:/apt/英语单词/mobile/js/deck.js#L195-L283) `sfxPlay()` 已有 `pick`（轻点）、`ok`（三音上行）、`goal`（收尾）；tokens `--paper-2 / --ink / --rule / --rule-2 / --mono / --serif / --ease`、错误色 `#A33A1E`、钢蓝 `#2B5B84`、成功绿 `#2E7A4B`。

## Proposed Changes

### 1. `mobile/js/exam.js` — 增加词块级反馈（L1）
- 新增 `examTransCueHit(text, cue)`：把输入按小写、去标点、压缩空白后，判断是否包含 cue（同样规范化）；返回布尔。
- 新增 `examTransCueMap(step)`：返回 `[{cue, hit}]`，供渲染；`hit` 由当前 `texts[step]` 现算，不落盘。
- `renderExamTrans()` 的当前句区块改造：
  - 输出**刻度条**：`<div class="ex-tr-ticks">`，每句一个 `<i>`，已完成为 `.on`，当前为 `.cur`；
  - 词块 chip 带 `data-ex-tr-cue` 与 `.on` 类（已命中）；
  - 已完成的句子改成单行纸条：`✓ + 单行省略文本 + （参考）`，文本用 `overflow:hidden;white-space:nowrap;text-overflow:ellipsis`，不再多行堆叠；
  - textarea 增加 `spellcheck="false" autocapitalize="sentences"`，保留 `oninput`。
- `examTransInput(el)` 增量更新，不重绘：
  - 同步文本、按钮可用态、词数；
  - 遍历当前句 chips，命中即加 `.on`，并**对一个新命中的词块播一次 `sfxPlay('pick')`**（每词块只响一次，靠 `examTransRun.cueFired[step]` 记忆，切句清空该句记录）；
  - 全部词块命中时给 `.ex-tr-zh` 加 `.ready`（左侧标记变绿点），不额外发声，避免吵。
- `examStartTrans()`/`examTransStepPrev()`/`examTransStepNext()` 初始化或清理 `cueFired`。

### 2. `mobile/css/exam.css` — 重写 `.ex-tr-*` 视觉（约 203–264 行区间替换）
目标：**一个主视觉（中文句）+ 一条进度刻度 + 一组可点亮词块 + 一张稿纸输入框**。
- `.ex-tr-ticks`：`display:flex;gap:3px;` 每格 `flex:1;height:3px;background:var(--rule-2)`；`.on` 用 `var(--ink)`；`.cur` 用 55% 墨；过渡 `background 240ms var(--ease)`。
- 标签区：`SENTENCE 01` 用 `--mono` 10px / 字距 .14em / 45% 墨；中文 `.ex-tr-zh` 提到 `1.06rem`、行高 1.9、`--serif`、纯墨，上方用 `border-top:1px solid var(--rule)` + `padding-top:.7rem` 与刻度分开。
- `.ex-tr-cues`：`gap:.35rem`；`.ex-tr-cue` 改为**虚线浅框 + 45% 墨**，命中后 `.on` 变实线墨框 + 墨字 + 右侧绿 ✓（用 `::after` 画，不新增 DOM 文字）；命中瞬间 `animation:exCueIn 260ms var(--ease)`（scale .96→1 + 描边加深）。
- `.ex-tr-refbtn`：改为无边框文字按钮，`color:#2B5B84`、11px 等宽、右侧 `⌄`；展开态加 `.open`（箭头翻转）。
- `.ex-tr-refseg`：字号 .86rem、行高 1.7、左 2px 钢蓝线、浅纸底（保留现有），与考题页批注同族。
- `.ex-tr-in`：去掉 1px 全边框，改 `border:0;border-bottom:1.5px solid var(--rule-2)`，浅纸底 `var(--paper-2)`，`min-height:96px`，`font-size:1.02rem;line-height:1.7;--serif`；`:focus{border-bottom-color:var(--ink)}`；`border-radius:0`。
- `.ex-tr-count`：只在有输入时显示（`::before` 不加），11px，`+N` 增量不做，保持数字即可。
- `.ex-tr-done-list`：去掉左侧 2px 竖线（与参考块撞），改每行底部发丝线；`.ex-tr-done` 单行截断、`padding:.42rem 0`、字号 .8rem；`.ex-tr-tick` 绿 ✓；`.ex-tr-refmark` 保持。
- `.ex-foot .ex-btn`：高度 46px、字号 .9rem；`.ex-btn.ghost` 用发丝线；两按钮 `flex:1`（`.ex-tr` 页内限定）。
- 结算页（done 分支）：`.ex-tr-cov` 数字提到 1.5rem/900，`覆盖率` 降为 10px 等宽前缀；`.ex-tr-stat` 改为两格并排（`grid-template-columns:1fr 1fr`，每格数字 + 小标签）。
- 所有新动画放进 `@media (prefers-reduced-motion: reduce)` 关闭位移、只留颜色。

### 3. 反馈分级（最终形态，便于验收）
| 级别 | 触发 | 表现 |
|---|---|---|
| L1 | 每个必用词块被写进输入框 | 该 chip 虚线变实线、出现绿 ✓、轻点音 `pick`（每词块一次） |
| L1.5 | 当前句词块全部命中 | 中文句左侧出现绿点（`.ready`），无额外音效 |
| L2 | 写完整句点「下一句」 | 句子折成单行纸条 + 绿 ✓ + 三音 `ok` + 刻度格填满 |
| L3 | 最后一句提交 | `goal` 音 + 结算页：大号覆盖率 + 独立/参考两格 |

## Assumptions & Decisions
- 不新增音效文件：只用现有 `pick / ok / goal`，静音开关沿用 `wc_sound_v1`。
- 不新增存储键，`refUsed / cueFired / done` 全部只存内存。
- 词块命中用"包含"判断而非严格词形匹配（用户可能写成复数/过去式），宁可宽松，保证正反馈不断。
- 已完成的句子不做展开回看（避免与「上一句」功能重复），只单行省略。
- 排版改动只在 `.ex-tr-*` 作用域内，不动全局 tokens 与其他题目页。

## Verification
1. `node --check mobile/js/exam.js`。
2. 本地 `python -m http.server 8899` + 浏览器（375 宽优先）：
   - 首屏层级：刻度条 → SENTENCE 01 → 中文显著大于词块与标签；截图确认无横向滚动（`scrollWidth == innerWidth`）。
   - L1：输入 `In recent years` → 对应 chip 立刻变实线并出现 ✓，控制台无报错；重复输入不重复触发样式抖动。
   - L1.5：写全 4 个词块 → 中文行出现绿点。
   - L2：写完整句点「下一句」→ 出现单行纸条 + ✓ + 刻度第 1 格变墨色。
   - L3：走完 4 句 → 结算页大号 `100%` 与两格统计；`独立完成 / 参考` 数字正确。
   - 回归：返回题库、上一句回改、静音开关关闭时无声音无报错。
3. 记忆库、四选一答题、刷词页各点一次，确认未被 `.ex-tr-*` 改动影响。
