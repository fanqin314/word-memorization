# Tasks

- [x] Task 1：状态与数据层：给逐句练习加等级、判分与位置区间能力，不改任何存储键。
  - [x] SubTask 1.1：`examTransRun` 增加 `level / checked / covers / missed / orderPicks / shuffled / levelHintTimer`；进入时从 `examData.transLv` 读取等级（默认 2），切换时写回 `wc_exam_v1`。
  - [x] SubTask 1.2：新增参考句工具：`examTransRefWords(step)`、`examTransCueRanges(step)`（定位每个词块的起止词位）、`examTransWordProgress(step)`（前缀逐词匹配，前 5 字母相同算命中）、`examTransNextHint(step)`（下一个词首字母）。
  - [x] SubTask 1.3：新增 `examTransSetLevel(lv)`：保留输入、撤销当前句判分、L1 重新洗牌；新增 `examTransResetCheck(step)` 供「重写这句」使用。

- [x] Task 2：轮播输入与 L2/L3/L4 渲染：把逐词反馈做成可感知的当前词。
  - [x] SubTask 2.1：把输入区改为「透明 textarea + 按词渲染的显示层」；聚焦时当前词放大、已完成词缩小，超宽时平滑滚动到当前词左侧约 34px，失焦回到普通文本外观。
  - [x] SubTask 2.2：当前词逐字母比对，错字母标红并抖动；光标在末尾且当前词匹配时自动补空格；输入只增量更新、不整体重绘。
  - [x] SubTask 2.3：L2 渲染完整词块 + 逐词进度条 + `x / y 词` + 「下一个词：首字母…」；L3 词块只显示前 3 字母 + 省略号；L4 隐藏词块、进度与提示。
  - [x] SubTask 2.4：词块点亮改为按 `examTransCueRanges` 的位置判定（输入前缀覆盖到词块末尾才点亮），保留每词块一次 `sfxPlay('pick')` 与全亮后中文竖线变绿。

- [x] Task 3：排序档：先认句，再动笔。
  - [x] SubTask 3.1：把整句英文打乱成固定位置的词块池（每次进入只洗一次牌）；点选进入答案区，正确为绿、错误为红，池中已选词只隐身不挪位；点答案区词块可撤回该词及之后的词。
  - [x] SubTask 3.2：5 秒无操作高亮下一个正确词块（未检查、未选完时生效）；检查时按正确位置占比出覆盖率，并展示参考句与「顺序全对」提示。

- [x] Task 4：单句内联检查、已完成记录与回放。
  - [x] SubTask 4.1：主按钮改为「检查」：本句覆盖率按该句参考计算，内联展示大号覆盖率（绿 / 红）、你的 / 参考、漏词；检查后输入只读，提供「重写这句」撤销判分。
  - [x] SubTask 4.2：已完成句子改为可展开记录（`01 已完成 ▸ / ▾`），展开显示「你的 / 参考」；替换现有单行纸条。
  - [x] SubTask 4.3：最后一句检查后进入整段回放：整段覆盖率（`trCoverage(t.en, 全文)`）、逐句「编号 · 覆盖率 / 中文 / 你的 / 参考」错落淡入、「再来一遍 / 返回题库」；仅此刻更新 `seen / right / best / last`。
  - [x] SubTask 4.4：在 `#view-exam` 唯一 click 委托中接线：`data-ex-lv`、`data-ex-sort`、`data-ex-unsort`、`data-ex-check`、`data-ex-rewrite`、`data-ex-expand`、`data-ex-replay-*`；输入 / 聚焦 / 失焦事件单独接线，保持 `e.stopPropagation()` 与无重复绑定。

- [x] Task 5：视觉重排（纸面校样方向）。
  - [x] SubTask 5.1：等级条（等宽小字 + 当前档墨底）、排序区（词池与答案区发丝线、已选隐身、错位批注红）、轮播区（当前词衬线大字、已完成词褪色、错字母批注红抖动、左右渐隐遮罩）、进度条与下一个词提示。
  - [x] SubTask 5.2：单句反馈块（大号覆盖率 + 你的 / 参考 + 漏词 chip）、已完成记录展开、回放列表（错落淡入）；按钮 ≥ 44px；`prefers-reduced-motion` 下关闭位移与抖动。

- [x] Task 6：验证与提交。
  - [x] SubTask 6.1：`node --check`；用临时 Node 桩脚本校验位置区间、逐词进度、自动空格、等级切换与判分状态（验证后删除桩脚本）。
  - [x] SubTask 6.2：本地 `python -m http.server 8899` + 375px 浏览器实测四档各一遍、单句检查、回放、返回键与刷新；回归题库 / 记忆库 / 四选一 / 刷词；控制台 0 error、无横向滚动。
  - [x] SubTask 6.3：`git commit` + `git push origin main`，提交信息说明"四档记忆与轮播输入"。

# Task Dependencies

- Task 2 依赖 Task 1
- Task 3 依赖 Task 1
- Task 4 依赖 Task 1、Task 2（复用逐词匹配与判分状态）
- Task 5 依赖 Task 2、Task 3、Task 4
- Task 6 依赖 Task 5
