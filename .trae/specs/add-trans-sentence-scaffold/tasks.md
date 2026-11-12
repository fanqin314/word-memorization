# Tasks

- [x] Task 1: 补齐句级数据 `EXAM_TRANS_SEG`（4 段 × 逐句）
  - [x] SubTask 1.1: 按句号切 4 段中文，确定每段句数与每句中文原文
  - [x] SubTask 1.2: 逐句给出英文参考（与整段 `en` 用词一致；`t3` 首句合并英文前两句）
  - [x] SubTask 1.3: 每句抽 3–5 个必用词块（必须出现在该句参考英文里）
- [x] Task 2: 渲染层接入句级数据
  - [x] SubTask 2.1: `examStartTrans` 优先用 SEG 生成 parts（中文）、refs（英文）、cues（词块），缺失时回退 `examTransChunks`
  - [x] SubTask 2.2: 每句页渲染中文、词块、输入框、`看这句参考` 按钮与参考文本
  - [x] SubTask 2.3: 无 SEG 时不渲染参考按钮
- [x] Task 3: 交互与记录
  - [x] SubTask 3.1: `看这句参考 / 收起参考` 切换，不重绘输入框（保留已输入内容与光标）
  - [x] SubTask 3.2: 记录每句 `refUsed`，完成清单加「参考」徽标
  - [x] SubTask 3.3: 结果页追加 `独立完成 X 句 · 参考 Y 句`
- [x] Task 4: 样式
  - [x] SubTask 4.1: 词块提示（等宽小字、发丝线胶囊、可换行）
  - [x] SubTask 4.2: 参考块（浅底、左侧 2px 竖线、与页边批注同族）
  - [x] SubTask 4.3: 完成清单「参考」徽标与结果页统计行
- [x] Task 5: 验证
  - [x] SubTask 5.1: `node --check mobile/js/exam.js`
  - [x] SubTask 5.2: Node 校验四段 SEG 与中文句数一一对应、词块均出现在对应英文里
  - [x] SubTask 5.3: 浏览器走一遍 Unit 1：展开参考→写入→下一句→全部完成→结果页统计

# Task Dependencies
- Task 2 依赖 Task 1
- Task 3 依赖 Task 2
- Task 4 可与 Task 2 并行
- Task 5 依赖 Task 1–4
