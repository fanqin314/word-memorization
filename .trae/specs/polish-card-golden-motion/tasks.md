# Tasks

- [x] Task 1: 正面黄金比例排版（CSS）
  - [x] SubTask 1.1: 在 `:root` 增加 `--phi:1.618` 与间距阶梯 `--sx1:.382rem`、`--sx2:.618rem`、`--sx3:1rem`、`--sx4:1.618rem`
  - [x] SubTask 1.2: 重排 `.face`、`.card-head`、`.card-main`、`.word-row`、`.word`、`.ipa`、`.pos`、`.gloss` 的间距与字号（词 `clamp(1.95rem,9.2vw,2.618rem)`、释义 `1rem`、音标 `.75rem`、词性 `.618rem`）
  - [x] SubTask 1.3: `.art-frame` 改为 1.618:1（`height:clamp(96px,30vh,200px);width:auto`，≤389px 用 `calc((100vw - 66px) / 1.618)` 反推防横溢），同步 `.scene`、`.morph`、`.actions` 上边距与 `.rate` 圆角/内边距
  - [x] SubTask 1.4: 390×844 与 390×640 两档实测无裁切、无横向溢出，图形框保持黄金比例

- [x] Task 2: 动效系统（CSS 为主，少量状态类）
  - [x] SubTask 2.1: 正面子块级联入场（0/40/80/120/160/180/200ms 延迟，400ms 时长，`cubic-bezier(.16,1,.3,1)`，末块 600ms 收尾）
  - [x] SubTask 2.2: 图形框入场缩放 + 8s 呼吸（±4px）；`prefers-reduced-motion: reduce` 下全部关闭
  - [x] SubTask 2.3: 评分按钮压印环（320ms 扩散，颜色取 `--rc` 语义色）、`deckPos` 数字 tick、今日达标进度线扫光（每天一次）

- [x] Task 3: 合成音效与开关（WebAudio）
  - [x] SubTask 3.1: 新增 `Sfx` 模块：懒创建 `AudioContext`、首次手势 resume、master gain ≤ .25、页面隐藏时 suspend、静音直接 return
  - [x] SubTask 3.2: 实现 9 种音色：`rate2/rate1/rate0/skip/flip/drop/ok/bad/goal`
  - [x] SubTask 3.3: 挂接 `rateWord`/`advance`（含跳过）、翻面处理、拼写落格与判定、首次达标
  - [x] SubTask 3.4: `deck-meta` 右侧加 24px 喇叭开关，状态存 `wc_sound_v1`（不进 MB_KEY），切换后 toast 提示

- [x] Task 4: 回归与提交
  - [x] SubTask 4.1: 两档尺寸下四向滑动、点按翻面、背面横滑、拼写拖拽与自动判定、自测 Enter 全部复跑
  - [x] SubTask 4.2: 静音开关刷新后保持；朗读与音效互不打断
  - [x] SubTask 4.3: `git status` 确认仅 `mobile/index.html` 变更并提交

# Task Dependencies
- Task 2 依赖 Task 1（布局尺寸定稿后再调节奏）
- Task 3 可与 Task 2 并行（主要触及 JS 与 `deck-meta`）
- Task 4 依赖 Task 1、Task 2、Task 3
