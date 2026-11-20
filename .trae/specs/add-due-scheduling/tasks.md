# Tasks

- [x] Task 1: 新增按天帧与到期写入
  - [x] SubTask 1.1: 新增 `startOfDay(ts)`（当天 0 点时间戳），供调度与统计共用
  - [x] SubTask 1.2: `rec()` 为缺失的 `dueAt` 补 `0`（从未排期 = 已到期）
  - [x] SubTask 1.3: 新增 `dueAfter(level)`：0 → 今天 0 点；1 → +1 天；2 → +3 天
  - [x] SubTask 1.4: `rateWord()` 评级成功后写入 `r.dueAt = dueAfter(level)`

- [x] Task 2: 队列按到期排序
  - [x] SubTask 2.1: `buildQueue` 改为 `dueAt` 升序 → 掌握度升序 → 单词字母序
  - [x] SubTask 2.2: 保留 `ratedToday` 排尾与 `onlyFresh` 语义（`fresh.concat(done)`）
  - [x] SubTask 2.3: 删除已无引用的 `isDue()`，确认无残留调用

- [x] Task 3: 数据页「待复习」改为真实到期数
  - [x] SubTask 3.1: 统计处改用 `startOfDay(Date.now())` 与 `rec(w).dueAt` 比较
  - [x] SubTask 3.2: 保留 `reviewDone` 的既有用途（词库详情打卡 x/4、卡片显示）

- [x] Task 4: 验证与发布
  - [x] SubTask 4.1: `node check_mobile.js` 语法 0 错误
  - [x] SubTask 4.2: 本地浏览器验证：三档 `dueAt` 值、队列顺序（0 → 昨天 → 明天）、次日重建、刷新续接、待复习数字
  - [x] SubTask 4.3: 提交推送并轮询线上确认新代码（commit `f7e121c`，线上已生效）

# Task Dependencies

- Task 2 依赖 Task 1（需要 `dueAt` 与 `startOfDay`）
- Task 3 依赖 Task 1
- Task 4 依赖 Task 1–3
