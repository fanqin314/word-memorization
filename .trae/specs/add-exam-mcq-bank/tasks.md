# Tasks

- [x] Task 1: 题库数据落地——把题库 md 的 8 组 72 小题转成 `EXAM_GROUPS` 常量嵌入 `mobile/index.html`（题干空位用 `___`，双空题标 `___(1)/___(2)`；每题含 `o` 四选项、`a` 正确下标、`n` 考点解析；组含 `unit/kind/title/ref/bank`）。
  - [x] SubTask 1.1 Unit 1 · Words in use（10 题，p.11）与 Expressions in use（8 题，p.13）
  - [x] SubTask 1.2 Unit 2 · Words in use（10 题，p.38）与 Expressions in use（8 题，p.40）
  - [x] SubTask 1.3 Unit 3 · Words in use（10 题，p.66）与 Expressions in use（8 题，p.68，含双空第 4、7 题）
  - [x] SubTask 1.4 Unit 4 · Words in use（10 题，p.92）与 Expressions in use（8 题，p.94）
  - [x] SubTask 1.5 逐题核对答案字母与正确答案文本，与 md 一致（72 题 / 74 空）

- [x] Task 2: 导航与容器——`.tabbar` 改 5 列，新增 `data-tab="exam"` 按钮（图标 + 「期末」）与 `#view-exam` section；`switchTab` 接入 `renderExam()` 并复位滚动。

- [x] Task 3: 题库首页——按 Unit 分组列出 8 个题组（题数、最好正确率细线进度、错题数），顶部「全部混合」与「只刷错题(n)」入口；沿用现有 tokens（`--paper-2/--ink/--rule/--mono/2px` 方角）。

- [x] Task 4: 答题与结果——题干（空位下划线、双空标号）+ 四选一即时判分（正确项墨底白字 / 错选标红 + 正确项高亮 / 其余降存在感）+ 考点解析展开 + 「下一题」；结果页得分、正确率、错题清单、「重做错题」「再来一轮」「返回题库」。

- [x] Task 5: 持久化与错题——`wc_exam_v1` 读写与容错、每轮结算写入、答对后移出错题、首页进度回显、跨组「只刷错题」聚合与空态禁用。

- [x] Task 6: 验证与提交——`node --check` 通过；本地 `http.server` 用浏览器子代理跑「进入题库 → 答一组（含答对/答错）→ 结果页 → 重做错题 → 刷新看进度 → 只刷错题为 0 时禁用」；抽查至少 8 题答案与 md 一致；确认刷词/词库/自测/数据四页与既有存储键未受影响；`git commit` + `git push origin main`。

- [x] Task 7: 汉译英段落练习——`EXAM_TRANS` 收录 Unit 1–4 四段（中文原文 + 参考译文），首页新增 Section C 区块，练习页支持多行输入、「对照译文」、实词覆盖率（≥60% 通过）、未命中关键词、结果页与 `examState.trans` 存档回显。

- [x] Task 8: 记忆库——`EXAM_MEMO` 收录用户整理的 8 组 72 条记忆条（词形含 `==变形==`、提示搭配、中文含 `**重点**`）；`memoFor/examMemoW/examMemoZh/examMemoMask/examMemoLine` 渲染工具；答题解析与结果页错题清单追加「搭配」行；首页新增 MEMORY 入口与背诵页（默认遮英文、点开看词、展开态不持久化），双空题共用一条。

# Task Dependencies

- Task 3、4、5 依赖 Task 1（数据）与 Task 2（容器）。
- Task 4 依赖 Task 3 的首页入口。
- Task 5 依赖 Task 4 的判分与结果流程。
- Task 6 依赖 Task 1–5 全部完成。
