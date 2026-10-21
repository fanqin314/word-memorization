# Tasks

- [ ] Task 1: 重写 `自动同步单词.ps1` 为常驻监听进程
  - [ ] SubTask 1.1: 单实例锁（命名 Mutex），已有实例时直接退出
  - [ ] SubTask 1.2: 用 `FileSystemWatcher` 监听工作目录与 `%USERPROFILE%\Downloads`（Created / Changed / Renamed）
  - [ ] SubTask 1.3: 2 秒去抖 + 串行队列，处理前等待文件大小稳定
  - [ ] SubTask 1.4: 处理流程：下载目录搬入 → 调 `更新单词数据.ps1 -NoSync` → `git add/commit/push`
  - [ ] SubTask 1.5: 推送失败按 30/60/120/300s 退避重试，成功或文件再变化时重置
  - [ ] SubTask 1.6: 日志 `.sync.log` 写入并截断到最近 500 行；记录 PID 到 `.sync.pid`

- [ ] Task 2: 提供图形化开关入口
  - [ ] SubTask 2.1: 改写 `开启自动同步.bat`：注册登录自启（启动文件夹快捷方式或计划任务 /SC ONLOGON）并立即拉起监听
  - [ ] SubTask 2.2: 新增 `停止自动同步.bat`：结束监听进程并禁用自启
  - [ ] SubTask 2.3: 两个 `.bat` 均使用 `chcp 65001`，以 UTF-8 保存，中文正常显示

- [ ] Task 3: 计划任务改为看门狗
  - [ ] SubTask 3.1: 把 `WordCardsAutoSync` 从每 5 分钟执行改为每 30 分钟检查监听进程存活，不存在则拉起
  - [ ] SubTask 3.2: 记录看门狗动作到 `.sync.log`

- [ ] Task 4: 仓库与运行态整理
  - [ ] SubTask 4.1: `.gitignore` 增加 `.sync.pid`、`.sync.log`、`.sync-state`
  - [ ] SubTask 4.2: 清理仓库中遗留的 `deepseek_html_*.html`（若存在）

- [ ] Task 5: 端到端验证
  - [ ] SubTask 5.1: 在 `Downloads` 放一张新卡，观察 5 秒内搬入、改名、生成、推送
  - [ ] SubTask 5.2: 检查 `.sync.log` 有完整链路日志，远端出现新 commit
  - [ ] SubTask 5.3: 模拟推送失败（临时断网或错误 remote）验证退避重试与恢复
  - [ ] SubTask 5.4: 双击停止/开启脚本，验证进程启停与幂等（不会出现两个实例）
  - [ ] SubTask 5.5: 本机 `file://` 打开 `index.html`，确认新词出现在列表与搜索中

# Task Dependencies
- Task 2 依赖 Task 1（需要监听进程入口）
- Task 3 依赖 Task 1（看门狗检查的是新进程）
- Task 5 依赖 Task 1、2、3 完成
