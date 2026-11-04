# 单词卡即时同步流水线 Spec

## Why
现在新增单词卡依赖「每 5 分钟轮询」或手动双击脚本，用户希望像 Obsidian 那样——文件一落盘就立刻处理；电脑端只通过 `file://` 直接打开 `index.html`（不跑本地服务器），手机端通过 GitHub Pages 学习，两边都能尽快看到新词。

## What Changes
- 将「5 分钟计划任务」改为**常驻文件监听进程**（PowerShell `FileSystemWatcher`），同时监听工作目录与系统「下载」目录
- 事件去抖（约 2 秒）后立即执行：`deepseek_html_*.html` → `<单词>.html` 改名 → 生成 `words-data.js` → 提交 → 推送
- 单实例互斥锁：避免监听进程与手动 `.bat` 并发执行 git，导致冲突
- 推送失败自动重试（30s → 60s → 120s → 300s 退避，直到成功或文件再次变化）
- 登录时自动启动、隐藏窗口常驻；提供「开启自动同步.bat」「停止自动同步.bat」两个双击入口
- 计划任务改为**看门狗**：每 30 分钟检查监听进程是否存活，异常退出则拉起
- 日志 `.sync.log` 自动截断（只保留最近 500 行），状态写入 `.sync-state`
- 保留「更新单词数据.bat」作为手动兜底；本机 `file://` 打开 `index.html` 无需服务器即可生效
- 不改动卡片内容、前端布局与已有交互

## Impact
- Affected specs: 单词卡自动同步（原每 5 分钟轮询方案被替换）
- Affected code:
  - `自动同步单词.ps1`（重写为常驻监听 + 去抖 + 重试）
  - `开启自动同步.bat` / 新增 `停止自动同步.bat`
  - `.gitignore`（忽略运行态文件）
  - Windows 计划任务 `WordCardsAutoSync`（改为看门狗）

## ADDED Requirements

### Requirement: 文件落盘后即时同步
系统 SHALL 在工作目录出现新的 `deepseek_html_*.html`（或任何新卡片 HTML）后 5 秒内完成解析、改名、生成数据与推送。

#### Scenario: 新卡落入工作目录
- **WHEN** 用户把新卡保存/拖入 `d:\apt\英语单词`
- **THEN** 2 秒去抖后自动改名为 `<单词>.html`，重新生成 `words-data.js` 并推送到 `origin/main`
- **AND** `.sync.log` 记录一条「已推送」日志

#### Scenario: 新卡落在下载目录
- **WHEN** 浏览器把卡片下载到 `%USERPROFILE%\Downloads`
- **THEN** 监听进程在数秒内把它搬入工作目录并按上一条处理

#### Scenario: 文件尚在写入
- **WHEN** 卡片文件仍在被浏览器写入（大小持续变化）
- **THEN** 去抖窗口结束后才开始读取，避免解析到半截文件

### Requirement: 并发安全
系统 SHALL 保证同一时刻只有一个同步任务在运行（监听进程内部串行 + 与手动 `.bat` 互斥）。

#### Scenario: 手动双击与自动同步同时发生
- **WHEN** 监听进程正在生成数据，用户又双击了「更新单词数据.bat」
- **THEN** 第二个任务等待或直接退出，不产生 git 冲突与重复提交

### Requirement: 推送失败自动恢复
系统 SHALL 在推送失败（网络错误 / 502 / 凭据异常）时保留待同步状态，并按退避间隔自动重试。

#### Scenario: GitHub 短暂 502
- **WHEN** `git push` 返回 502
- **THEN** 日志记录失败原因，30s/60s/120s/300s 后自动重试
- **AND** 重试成功后清理重试状态

### Requirement: 常驻与可开关
系统 SHALL 在用户登录时自动启动监听，并提供一键开启/停止的图形入口。

#### Scenario: 开机登录
- **WHEN** 用户登录 Windows
- **THEN** 监听进程隐藏启动，且不会重复启动第二个实例

#### Scenario: 用户想临时关闭
- **WHEN** 用户双击「停止自动同步.bat」
- **THEN** 监听进程退出，后续文件变化不再自动同步，直到再次开启

### Requirement: 运行状态可观测
系统 SHALL 提供可读日志与状态信息，便于判断是否在正常同步。

#### Scenario: 排查同步是否生效
- **WHEN** 用户打开 `.sync.log`
- **THEN** 能看到每次检测、改名、生成、推送的时间戳与结果，且日志不会无限增长

## MODIFIED Requirements

### Requirement: 计划任务频率
原「每 5 分钟轮询执行一次生成与推送」改为「看门狗每 30 分钟确认监听进程存活」，实时性由文件监听的即时事件提供。

## REMOVED Requirements

### Requirement: 五分钟轮询同步
**Reason**: 实时性不足，且会在无变化时反复唤醒；已由常驻监听替代。
**Migration**: 保留 `更新单词数据.bat` 作为手动兜底；旧计划任务原地改写为看门狗，无需用户操作。
