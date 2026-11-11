# Tasks

- [x] Task 1: 卷面基础与动效令牌（`mobile/css/exam.css`）
  - [x] SubTask 1.1 新增考试本地变量：卷面色 `--ex-sheet`、印章红 `--ex-red:#A33A1E`、墨染/落笔/印章时长与缓动（复用 `--ease/--spring`），放在 `.ex-wrap` 作用域，不污染 `:root`
  - [x] SubTask 1.2 新增 keyframes：`exSheetIn`（铺开）、`exInkSweep`（墨色自左灌入）、`exWriteIn`（空格逐字 + 下划线自左向右）、`exStampIn`（印章落下回弹）、`exShakeX`（错选抖动 1 次）、`exNoteIn`（批注 8px 滑入）、`exRulerIn`（刻度尺生长）
  - [x] SubTask 1.3 在 `exam.css` 末尾补 `@media (prefers-reduced-motion:reduce)`：上述动画全部 `animation:none`，仅保留颜色/字重变化

- [x] Task 2: 卷面版式（`exam.js` 的 `renderExamRun`）
  - [x] SubTask 2.1 结构改为：进度刻度条（每题一格，`data-idx` + `right/wrong/cur` 三态）→ 左侧大号衬线题号 `03` 与等宽题注（Unit / 第 N 题 / 空 x/y）→ 题干 → 选项纸片 → 批注 → 底部按钮
  - [x] SubTask 2.2 刻度条按「空」计数（双空题两次判分各占一格），当前格有下划线指示；答对墨点、答错红点
  - [x] SubTask 2.3 375px 宽下不横向溢出；选项最小高 44px，长短语自然折行，字母标不换行

- [x] Task 3: 判分三连击（`examPick / examRunStem / examOptsHtml`）
  - [x] SubTask 3.1 点选时先给被点元素加 `.pick-live`（墨染过渡 140ms），再 `setTimeout(140)` 调用 `renderExamRun()`；状态在点击瞬间就已写入 `examRun.answers` 并 `persist`，保证动画期间重复点击不重复判分
  - [x] SubTask 3.2 重绘后：空格用 `exWriteIn` 逐字显示答案并对齐下划线；答对时容器加 `.judged-right` 触发 `exStampIn` 的 ✓ 章，答错加 `.judged-wrong` 触发 ✗ 章与正确项 `.lit` 虚线框
  - [x] SubTask 3.3 音效/震动：答对 `sfxPlay('chime')` + `sfxHaptic(12)`，答错 `sfxPlay('drop')` + `sfxHaptic([8,40,8])`；静音开关（`wc_sound_v1`）为关时不发声、不震动
  - [x] SubTask 3.4 动画进行中再次点击：不重复判分、不重复累计 `right`、不重复写错题（沿用 `examRun.answers[key]` 早退）

- [x] Task 4: 解析批注 + 记忆便签（`renderExamRun` 内批注块）
  - [x] SubTask 4.1 批注结构：`<div class="ex-note">` 左侧 2px 竖线 + 等宽「考点」标签 + 正文，入场 `exNoteIn`
  - [x] SubTask 4.2 记忆条改为便签容器 `.ex-note-memo`（浅纸底、左竖线），内部仍用现有 `examMemoLine()`，不复制数据

- [x] Task 5: 合卷结果页（`renderExamResult`）
  - [x] SubTask 5.1 分数 `ex-res-num` 做 500ms count-up（`requestAnimationFrame`，减少动效时直接落值）
  - [x] SubTask 5.2 正确率刻度尺：一格一题，对墨错红，宽度按题数均分，入场 `exRulerIn`
  - [x] SubTask 5.3 全对时盖「全对」大章 + 现有「这组可以放下了」文案；错题卡片保留题干 / 正确答案 / 考点 / 搭配四级信息
  - [x] SubTask 5.4 三个按钮在 375px 宽下不挤成两行，禁用态仍可辨识

- [x] Task 6: 首页入口与按压（`renderExam` + `exam.css`）
  - [x] SubTask 6.1 题组行按下位移 ≤2px + 纸页阴影，松开回弹；不改变行内文案与计数
  - [x] SubTask 6.2 「全部混合 / 只刷错题 / MEMORY」按钮按下缩放 0.985，禁用态不变

- [x] Task 7: 验证
  - [x] SubTask 7.1 `node --check` 通过（`js/exam.js`）；`exam.css` 花括号配平
  - [x] SubTask 7.2 本地 `http.server` + 浏览器子代理走通：进入一组 → 答对一题（观察墨染/落笔/✓ 章）→ 答错一题（观察抖动/虚线框/✗ 章）→ 双空题两空各判一次 → 结果页（分数 count-up、刻度尺、错题卡）→ 重做错题 → 刷新后 `wc_exam_v1` 进度仍在
  - [x] SubTask 7.3 回归：刷词 / 词库 / 自测 / 数据四页正常；答题态隐藏 tabbar 与手机返回键回题库仍生效；控制台无报错、无 404
  - [x] SubTask 7.4 手机视口（375×667）截图确认无横向溢出、无元素重叠

- [x] Task 8: 提交推送——`git add mobile/css/exam.css mobile/js/exam.js .trae/specs/restyle-exam-paper-stage` → commit → `git push origin main`

# Task Dependencies

- Task 2 依赖 Task 1（令牌与 keyframes）。
- Task 3、4 依赖 Task 2 的卷面结构。
- Task 5 依赖 Task 3 的判分结果数据（`examRun.right/wrong`）。
- Task 6 与 Task 2–5 无依赖，可与 Task 1 并行。
- Task 7 依赖 Task 1–6；Task 8 依赖 Task 7 全部通过。
