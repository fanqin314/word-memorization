# Tasks

- [x] Task 1: 详情层外壳与顶部条改为米纸内页
  - [x] SubTask 1.1: `.lib-detail` 加米纸底 + 与 `.lib-stage` 相同纸纹，内边距对齐墙面（12px 14px 0），`show` 时 flex 布局保持
  - [x] SubTask 1.2: `.detail-top` 改为发丝线下压：mono 小字标题、`.back-btn` 30px 方角墨线按钮（按下反白）、`.bulk-btn` 2px 方角墨底米字
  - [x] SubTask 1.3: 去掉旧的瓷白阴影/圆角变量残留，确认顶部条在三档宽度（320/390/480）不换行不挤压

- [x] Task 2: 徽章改墨色标本牌 + 17 种字形 + 标本标签栏
  - [x] SubTask 2.1: 抽出 `libFaceKey(L)`，让 `renderLibGrid` 与 `renderLibDetail` 共用同一字体映射
  - [x] SubTask 2.2: `.badge` 改为 84px、2px 圆角、墨底米字、`::before/::after` 四角细线；补 `.lib-detail[data-style="a"…"w"] .badge-gl` 17 套变体
  - [x] SubTask 2.3: 新增 `.badge-wrap`（左徽章 + 右标签栏）与 `.badge-meta`：`bm-row`（LETTER / FACE / STUDIED）+ 2px 掌握度进度线（灰/金/绿语义色）
  - [x] SubTask 2.4: `renderLibDetail` 输出新结构，徽章字加 `gl` 类，`detail.dataset.style` 按字体键设置

- [x] Task 3: 词卡改为统一编辑版式
  - [x] SubTask 3.1: `.w-grid` 保持 2 列、gap 10px；`.w-card` 改为米纸底 + 1px 发丝线，首卡 `grid-column:span 2` 且词数 ≥3 时才加 `.lead`
  - [x] SubTask 3.2: 卡片内容：`.w-top` 序号、`.w-word` 衬线词（lead 卡带青铜色 `.w-cap` 首字）、`.w-ipa` 等宽、`.w-gloss` 2px 词卡色引线、`.w-foot` 加 `.w-mst` 点标签（灰/金/绿）+ `.w-chk` 打卡
  - [x] SubTask 3.3: 入场 `wcIn` 交错（`--i` 延迟）；卡片不加按压缩放，动画 fill 不覆盖卡片样式

- [x] Task 4: 飞行动画落点对齐
  - [x] SubTask 4.1: `libFly` 终点从硬编码 mix 颜色改为读取 `#libBadge` 与 `.badge-gl` 的计算背景/字色/字号；描边或透明字回退为墨色
  - [x] SubTask 4.2: 起点仍为墙面裸墨字（透明底、`--news-ink`），结束圆角 2px，不出现彩色残影

- [x] Task 5: 验证与提交
  - [x] SubTask 5.1: 语法校验（`node --check` 提取脚本或浏览器控制台无报错）
  - [x] SubTask 5.2: 手机尺寸浏览器验证：A–W 若干字母打开/返回、首卡跨列、17 种徽章抽查（a/b/c/d/s/t/u/w）、点词跳转、刷这组进队列、快速连点无重复执行
  - [x] SubTask 5.3: `git add mobile/index.html` 提交并推送 `main`

# Task Dependencies
- Task 2 依赖 Task 1（共用内页留白与顶部条高度）
- Task 3 依赖 Task 1（网格宽度与留白）
- Task 4 依赖 Task 2（徽章结构确定后才能取计算样式）
- Task 5 依赖 Task 1–4
